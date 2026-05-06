from mimetypes import guess_type
from os.path import basename

from django.core.files.storage import default_storage
from django.http import FileResponse, Http404


def serve_media_file(request, file_path):
    try:
        stored_file = default_storage.open(file_path, "rb")
    except FileNotFoundError as exc:
        raise Http404("File not found") from exc
    except OSError as exc:
        raise Http404("An unexpected error occurred") from exc

    content_type, _ = guess_type(file_path)
    response = FileResponse(
        stored_file, content_type=content_type or "application/octet-stream"
    )
    response["Content-Disposition"] = f'inline; filename="{basename(file_path)}"'
    return response
