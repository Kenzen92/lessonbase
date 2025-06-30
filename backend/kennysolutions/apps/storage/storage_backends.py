# storage/storage_backends.py

import sys
import gridfs
from pymongo import MongoClient
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings

class GridFSStorage(Storage):
    def __init__(self, db_name=None, collection='fs'):  # Provide a default collection name 'fs'
        self.db_name = db_name or settings.MONGO_DB_NAME
        self.collection = collection or 'fs'
        # Debug print all values from settings
        print("🔧 MongoDB Configuration Debug:")
        print(f"MONGO_USERNAME: {settings.MONGO_USERNAME}")
        print(f"MONGO_PASSWORD: {settings.MONGO_PASSWORD}")
        print(f"MONGO_URI: {settings.MONGO_URI}")
        print(f"MONGO_HOST: {settings.MONGO_HOST}")
        print(f"MONGO_DB_NAME: {settings.MONGO_DB_NAME}")
        print(f"MONGO_PORT: {settings.MONGO_PORT}")
        print(f"GRIDFS_COLLECTION: {settings.GRIDFS_COLLECTION}")
        # Initialize the MongoDB client using the full URI
        self.client = MongoClient(settings.MONGO_URI)
        self.db = self.client[self.db_name]
        self.fs = gridfs.GridFS(self.db, collection=self.collection)

    def _open(self, name, mode='rb'):
        grid_out = self.fs.get_last_version(filename=name)
        return ContentFile(grid_out.read())

    def _save(self, name, content, context=None):
            # Extract content type from uploaded file or default to application/octet-stream
            content_type = getattr(content, 'content_type', 'application/octet-stream')            
            grid_in = self.fs.new_file(filename=name, content_type=content_type)
            grid_in.write(content.read())
            grid_in.close()
            
            return name

    def exists(self, name):
        return self.fs.exists({"filename": name})

    def delete(self, name):
        file_id = self.fs.get_last_version(filename=name)._id
        self.fs.delete(file_id)

    def size(self, name):
        grid_out = self.fs.get_last_version(filename=name)
        return grid_out.length

    def url(self, name):
        # Ensure that name is just the filename, not a full URL
        if name.startswith(settings.BASE_URL):
            # If the name already contains the base URL, return it as-is
            return name

        # Otherwise, generate the correct URL
        if "profile_pictures" in name:
            return f'{settings.BASE_URL}/media/{name}'
        else:
            return f'{settings.BASE_URL}/media/{self.collection}/{name}'


    def get_available_name(self, name, max_length=None):
        if not self.exists(name):
            return name
        return self._generate_available_name(name, max_length)

    def _generate_available_name(self, name, max_length=None):
        count = 1
        new_name = name
        while self.exists(new_name):
            new_name = f"{name}_{count}"
            count += 1
        return new_name
