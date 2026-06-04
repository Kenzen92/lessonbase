from rest_framework import generics, permissions
from apps.tags.models import Tag
from apps.tags.serializers import TagSerializer


class TagListCreateView(generics.ListCreateAPIView):
    """
    GET /tags/?q=<search>&kind=<kind>  — list/autocomplete existing tags.
    POST /tags/                        — create-on-type a new tag.
    """

    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Tag.objects.all()
        q = self.request.query_params.get("q")
        kind = self.request.query_params.get("kind")
        if q:
            qs = qs.filter(name__icontains=q)
        if kind:
            qs = qs.filter(kind=kind)
        return qs
