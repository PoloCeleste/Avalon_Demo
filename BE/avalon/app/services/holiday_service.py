from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime, date
import requests
import xml.etree.ElementTree as ET

from ..models.holiday import Holiday
from ..schemas.holiday import HolidayCreate, HolidayUpdate
from ..core.config import settings

class HolidayService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_holiday(self, holiday_id: int) -> Holiday:
        result = await self.db.execute(select(Holiday).where(Holiday.holiday_id == holiday_id))
        holiday = result.scalars().first()
        if not holiday:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holiday not found")
        return holiday

    async def get_all_holidays(self, skip: int = 0, limit: int = 100) -> List[Holiday]:
        stmt = select(Holiday).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_holiday(self, holiday_data: HolidayCreate) -> Holiday:
        result = await self.db.execute(select(Holiday).where(Holiday.holiday_date == holiday_data.holiday_date))
        existing_holiday = result.scalars().first()
        if existing_holiday:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Holiday with the same date already exists")

        db_holiday = Holiday(**holiday_data.model_dump())
        self.db.add(db_holiday)
        await self.db.commit()
        await self.db.refresh(db_holiday)
        return db_holiday

    async def update_holiday(self, holiday_id: int, holiday_data: HolidayUpdate) -> Holiday:
        db_holiday = await self.get_holiday(holiday_id)
        update_data = holiday_data.model_dump(exclude_unset=True)
        if "holiday_date" in update_data:
            result = await self.db.execute(select(Holiday).where(
                Holiday.holiday_date == update_data["holiday_date"],
                Holiday.holiday_id != holiday_id
            ))
            existing_holiday = result.scalars().first()
            if existing_holiday:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Another holiday with this date already exists")
        for key, value in update_data.items():
            setattr(db_holiday, key, value)
        await self.db.commit()
        await self.db.refresh(db_holiday)
        return db_holiday

    async def delete_holiday(self, holiday_id: int):
        db_holiday = await self.get_holiday(holiday_id)
        await self.db.delete(db_holiday)
        await self.db.commit()
        return {"detail": "Holiday successfully deleted"}

    async def sync_public_holidays(self, sol_year: int):
        """
        Fetches public holiday data from data.go.kr and syncs it with the database.
        """
        url = 'http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo'
        params = {
            'serviceKey': settings.service_key,
            'pageNo': '1',
            'numOfRows': '200',
            'solYear': str(sol_year)
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            root = ET.fromstring(response.content)
            items = root.find('.//items')
            if items is None:
                print(f"No items found in XML response for year {sol_year}")
                return
            for item in items.findall('item'):
                is_holiday = item.find('isHoliday').text
                if is_holiday == 'Y':
                    date_name = item.find('dateName').text
                    locdate_str = item.find('locdate').text
                    holiday_date = datetime.strptime(locdate_str, '%Y%m%d').date()
                    result = await self.db.execute(select(Holiday).where(Holiday.holiday_date == holiday_date))
                    existing_holiday = result.scalars().first()
                    if not existing_holiday:
                        holiday_data = HolidayCreate(
                            holiday_name=date_name,
                            holiday_date=holiday_date
                        )
                        try:
                            await self.create_holiday(holiday_data)
                            print(f"Added new holiday: {date_name} on {holiday_date}")
                        except HTTPException as e:
                            print(f"Failed to add holiday {date_name} on {holiday_date}: {e.detail}")
                        except Exception as e:
                            print(f"An unexpected error occurred while adding holiday {date_name} on {holiday_date}: {e}")
                    else:
                        print(f"Holiday {date_name} on {holiday_date} already exists. Skipping.")

        except requests.exceptions.RequestException as e:
            print(f"Error fetching public holidays: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch public holidays: {e}")
        except ET.ParseError as e:
            print(f"Error parsing XML response: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to parse public holidays XML: {e}")
        except Exception as e:
            print(f"An unexpected error occurred during public holiday sync: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")