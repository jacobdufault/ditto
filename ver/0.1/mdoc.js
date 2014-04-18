var mdoc = {
    // page element ids
    content_id: "#content",
    sidebar_id: "#sidebar",
    edit_id: "#edit",
    back_to_top_id: "#back_to_top",
    loading_id: "#loading",
    error_id: "#error",

    // display elements
    sidebar: true,
    edit_button: true,
    back_to_top_button: true,

    // initialize function
    run: initialize
};

function initialize() {
    // initialize sidebar and buttons
    if (mdoc.sidebar) {
        init_sidebar_section();
    }

    if (mdoc.back_to_top_button) {
        init_back_to_top_button();
    }

    if (mdoc.edit_button) {
        init_edit_button();
    }

    // page router
    router();
    $(window).on('hashchange', router);
}

function init_sidebar_section() {
    $.get(mdoc.sidebar_file, function(data) {
        $(mdoc.sidebar_id).html(marked(data));
    }, "text").fail(function() {
        alert("Opps! can't find the sidebar file to display!");
    });

}

function init_back_to_top_button() {
    $(mdoc.back_to_top_id).show();
    $(mdoc.back_to_top_id).on("click", function() {
        $("html body").animate({
            scrollTop: 0
        }, 200);
    });
}

function init_edit_button() {
    if (mdoc.base_url === null) {
        alert("Error! You didn't set 'base_url' when calling mdoc.run()!");

    } else {
        $(mdoc.edit_id).show();
        $(mdoc.edit_id).on("click", function() {
            var hash = location.hash.replace("#", "/");

            if (hash === "") {
                hash = "/" + mdoc.index.replace(".md", "");
            }

            window.open(mdoc.base_url + hash + ".md");
            // open is better than redirecting, as the previous page history
            // with redirect is a bit messed up
        });
    }
}

function replace_symbols(text) {
    // replace symbols with underscore
    return text.replace(/[&\/\\#,+=()$~%.'":*?<>{}\ \]\[]/g, "_");
}

function li_create_linkage(li_tag, header_level) {
    // add custom id and class attributes
    html_safe_tag = replace_symbols(li_tag.text());
    li_tag.attr("id", html_safe_tag);
    li_tag.attr("class", "link");

    // add click listener - on click scroll to relevant header section
    $(mdoc.content_id + " li#" + li_tag.attr("id")).click(function() {
        // scroll to relevant section
        var header = $(
            mdoc.content_id + " h" + header_level + "." + li_tag.attr("id")
        );
        $('html, body').animate({
            scrollTop: header.offset().top
        }, 200);

        // highlight the relevant section
        original_color = header.css("color");
        header.animate({ color: "#ED1C24", }, 500, function() {
            // revert back to orig color
            $(this).animate({color: original_color}, 2500);
        });
    });
}

function create_page_anchors() {
    // create page anchors by matching li's to headers
    // if there is a match, create click listeners
    // and scroll to relevant sections

    // go through header level 2 and 3
    for (var i = 2; i <= 4; i++) {
        // parse all headers
        var headers = [];
        $('#content h' + i).map(function() {
            headers.push($(this).text());
            $(this).addClass(replace_symbols($(this).text()));
        });

        // parse and set links between li and h2
        $('#content ul li').map(function() {
            for (var j = 0; j < headers.length; j++) {
                if (headers[j] === $(this).text()) {
                    li_create_linkage($(this), i);
                }
            }
        });
    }
}

function derelativize_paths() {
    // images
    $(mdoc.content_id + " img").map(function() {
        var src = $(this).attr("src").replace("./", "");
        if ($(this).attr("src").slice(0, 5) !== "http") {
            var url = location.hash.replace("#", "");

            // split and extract base dir
            url = url.split("/");
            var base_dir = url.slice(0, url.length - 1).toString();

            // derelativize the path (i.e. make it absolute)
            $(this).attr("src", base_dir + "/" + src);
        }
    });

}

function show_error() {
    console.log("SHOW ERORR!");
    $(mdoc.error_id).show();
}

function show_loading() {
    $(mdoc.loading_id).show();
    $(mdoc.content_id).html("");  // clear content

    // infinite loop until clearInterval() is called on loading
    var loading = setInterval(function() {
        $(mdoc.loading_id).fadeIn(1000).fadeOut(1000);
    }, 2000);

    return loading;
}

function router() {
    var path = location.hash.replace("#", "./");

    // default page if hash is empty
    if (location.pathname === "/index.html") {
        path = location.pathname.replace("index.html", mdoc.index);
    } else if (path === "") {
        path = window.location + mdoc.index;
    } else {
        path = path + ".md";
    }

    // otherwise get the markdown and render it
    var loading = show_loading();
    $.get(path , function(data) {
        $(mdoc.error_id).hide();
        $(mdoc.content_id).html(marked(data));

        derelativize_paths();
        create_page_anchors();

    }).fail(function() {
        show_error();

    }).always(function() {
        clearInterval(loading);
        $(mdoc.loading_id).hide();

    });
}