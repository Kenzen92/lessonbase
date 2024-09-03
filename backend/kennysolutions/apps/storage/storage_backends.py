# storage/storage_backends.py

import gridfs
from pymongo import MongoClient
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings

class GridFSStorage(Storage):
    def __init__(self, db_name=None, collection='fs'):
        self.db_name = db_name or settings.MONGO_DB_NAME
        self.collection = collection

        # Initialize the MongoDB client using the full URI
        self.client = MongoClient(settings.MONGO_URI)
        self.db = self.client[self.db_name]
        self.fs = gridfs.GridFS(self.db, collection=self.collection)

    def _open(self, name, mode='rb'):
        grid_out = self.fs.get_last_version(filename=name)
        return ContentFile(grid_out.read())

    def _save(self, name, content):
        grid_in = self.fs.new_file(filename=name)
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
        return f'/media/{name}'

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
