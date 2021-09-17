

function find_food() {
    const food = $('#search-bar').val();
    window.location.href = `/?food_give=${food}`;
}

function post() {
    const title = $('#title-post').val();
    const file = $('#input-pic')[0].files[0];
    const comment = $("#comment-post").val();
    const day = $("#day-post").val();
    console.log(title, file, comment, day);

    const formData = new FormData();

    formData.append("file_give", file);
    formData.append("title_give", title);
    formData.append("comment_give", comment);
    formData.append("day_give", day);

    $.ajax({
        type: "POST",
        url: "/new",
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        success: function ({ result, msg }) {
            if (result === "success") {
                alert(msg);
                window.location.href= '/';
            }
        }
    });
}


$('.logout-button').on('click', () => {
    $.removeCookie('mytoken', {path: '/'});
    window.location.href = '/login'
});