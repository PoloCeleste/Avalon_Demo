from pydantic import BaseModel
from typing import Optional
from ..models.todo import TodoType

class TodoBase(BaseModel):
    curri_detail_id: int
    subject_id: int
    todo_type: TodoType
    todo_thing: str

class TodoCreate(TodoBase):
    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        yield cls.todo_type_to_upper

    @staticmethod
    def todo_type_to_upper(values):
        if 'todo_type' in values and values['todo_type']:
            # enum 변환 전 대문자 처리
            values['todo_type'] = str(values['todo_type']).upper()
        return values

class TodoUpdate(BaseModel):
    todo_type: Optional[TodoType] = None
    todo_thing: Optional[str] = None

    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        yield cls.todo_type_to_upper

    @staticmethod
    def todo_type_to_upper(values):
        if 'todo_type' in values and values['todo_type']:
            values['todo_type'] = str(values['todo_type']).upper()
        return values

class Todo(TodoBase):
    todo_id: int

    class Config:
        from_attributes = True