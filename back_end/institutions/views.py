from django.shortcuts import render


def _render_page(request, template_name, active_page, page_indicator):
    return render(
        request,
        template_name,
        {
            "active_page": active_page,
            "page_indicator": page_indicator,
        },
    )


def home(request):
    return _render_page(request, "home.html", "home", "Home")


def finder(request):
    return _render_page(request, "finder.html", "finder", "College Finder")


def career(request):
    return _render_page(request, "career.html", "career", "Career Guidance")


def compare(request):
    return _render_page(request, "compare.html", "compare", "Compare")


def tools(request):
    return _render_page(request, "tools.html", "tools", "Student Tools")

