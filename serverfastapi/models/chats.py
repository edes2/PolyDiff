from pydantic import BaseModel

class Message(BaseModel):
    emitterId: str
    content: str
    timestamp: str
