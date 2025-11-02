from django.http import HttpResponse, Http404
from django.conf import settings
from pymongo import MongoClient
import gridfs
import sys

def serve_mongo_file(request, collection, filename):
    print(request.path )

    try:
        client = MongoClient(settings.MONGO_URI)
        db = client[settings.MONGO_DB_NAME]

        # Determine the correct GridFS collection based on the request path
        if collection == "profile_pictures":
            collection_name = "profile_pictures"
        else:
            collection_name = "fs"
        
        fs = gridfs.GridFS(db, collection=collection_name)
        
        if collection == "profile_pictures":
            grid_out = fs.find_one({'filename': f"profile_pictures/{filename}"})
        else:
             print("wagaaan normal files")
             grid_out = fs.find_one({'filename': filename})
        if grid_out is None:
            print("DEBUG: File not found in GridFS", file=sys.stderr)
            raise Http404("File not found")

        # Serve the file as an HTTP response
        file_content = grid_out.read()

        response = HttpResponse(file_content, content_type=grid_out.content_type)
        response['Content-Disposition'] = f'inline; filename={grid_out.filename}'
        return response

    except Exception as e:
        raise Http404("An unexpected error occurred")
