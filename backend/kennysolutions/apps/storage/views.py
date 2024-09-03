from django.http import HttpResponse, Http404
from django.conf import settings
from pymongo import MongoClient
import gridfs
import sys

def serve_mongo_file(request, collection, filename):
    print("DEBUG: Entered serve_mongo_file function", file=sys.stderr)
    print(f"DEBUG: Collection: {collection}", file=sys.stderr)
    print(f"DEBUG: Filename: {filename}", file=sys.stderr)

    try:
        # Connect to MongoDB and GridFS
        print("DEBUG: Connecting to MongoDB...", file=sys.stderr)
        client = MongoClient(settings.MONGO_URI)
        print("DEBUG: MongoDB connection established", file=sys.stderr)

        db = client[settings.MONGO_DB_NAME]
        print(f"DEBUG: Accessing database: {settings.MONGO_DB_NAME}", file=sys.stderr)

        fs = gridfs.GridFS(db, collection=collection)
        print(f"DEBUG: Accessing GridFS collection: {collection}", file=sys.stderr)

        # Debug: List all files in the collection
        print("DEBUG: Listing all files in GridFS collection:", file=sys.stderr)
        for file in fs.find():
            print(f"DEBUG: File in GridFS: {file.filename}", file=sys.stderr)

        # Retrieve the file using a safer method
        print(f"DEBUG: Retrieving file with filename:{collection}/{filename}", file=sys.stderr)
        grid_out = fs.find_one({'filename': f"{collection}/{filename}"})
        
        if grid_out is None:
            print("DEBUG: File not found in GridFS", file=sys.stderr)
            raise Http404("File not found")

        print("DEBUG: File retrieved from GridFS", file=sys.stderr)

        # Serve the file as an HTTP response
        file_content = grid_out.read()
        print("DEBUG: File content read", file=sys.stderr)

        response = HttpResponse(file_content, content_type=grid_out.content_type)
        response['Content-Disposition'] = f'inline; filename={grid_out.filename}'
        print(f"DEBUG: Response created with Content-Disposition: {response['Content-Disposition']}", file=sys.stderr)

        return response

    except Exception as e:
        print(f"DEBUG: An unexpected error occurred: {e}", file=sys.stderr)
        raise Http404("An unexpected error occurred")
