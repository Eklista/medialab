from enum import Enum

class ContentType(str, Enum):
    VIDEO = "video"
    GALLERY = "gallery"
    GRADUATION = "graduation"

class ContentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
