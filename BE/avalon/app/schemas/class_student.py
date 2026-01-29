from pydantic import BaseModel

class ClassStudentBase(BaseModel):
    class_id: int
    student_id: int

class ClassStudentCreate(ClassStudentBase):
    pass

class ClassStudent(ClassStudentBase):
    belong_id: int

    class Config:
        from_attributes = True