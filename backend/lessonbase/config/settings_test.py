"""
Minimal settings override for running the test suite locally.
Inherits everything from the base settings, then overrides storage and DB.
"""
import os
import tempfile
from .settings import *  # noqa: F401, F403

# Use local file system for test file uploads
MEDIA_ROOT = tempfile.mkdtemp()
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
        "OPTIONS": {"location": MEDIA_ROOT},
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
