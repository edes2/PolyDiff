from fastapi import APIRouter
from message_service import MessageService
from pydantic import BaseModel

router = APIRouter(prefix='/api')


@router.get('/global/channels/{chatId}')
async def get_global_chat(chatId: str):
    chat = MessageService.get_global_chat(chatId)
    messages = chat['messages']
    MessageService.enrich_messages_username(messages)
    return messages


@router.get('/private/channels/{chatId}')
async def get_private_chat(chatId: str):
    chat = MessageService.get_private_chat(chatId)
    if (chat != None):
        messages = chat['messages']
        MessageService.enrich_messages_username(messages)
        return messages
    return []


@router.get('/general')  # TODO:
async def get_general_chat():
    chat = MessageService.get_general_chat()
    messages = chat['messages']
    MessageService.enrich_messages_username(messages)
    return messages


@router.get('/global/channels')
async def get_global_channels():
    return MessageService.get_all_global_channels_names()


@router.get('/global/users/{userId}')
async def get_joined_channels(userId: str):
    print(userId)
    return MessageService.get_joined_channels(userId)
