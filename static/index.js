const validateExtension = (event) => {
    const that = event.currentTarget;
    const extension = that.value.match(/\.([^\.]+)$/)[1];
    switch (extension) {
        case 'jpg':
        case 'png':
            break;
        default:
            alert('올바르지 않은 파일 확장자입니다. png 또는 jpg 파일을 등록해주세요.');
            that.value = '';
    }
};

function find_food() {
    const food = $('#search-bar').val();
    window.location.href = `/?food_give=${food}`;
}

function post() {
    const title = $('#title-post').val();
    const file = $('#input-pic')[0].files[0];
    const day = $("#day-post").val();
    const comment = $("#comment-post").val();

    if (!title || !file || !day || !comment) {
        alert('게시물의 각 항목을 모두 입력해주세요');
        return;
    }

    const formData = new FormData();
    const now = Date.now().toString();

    formData.append("file_give", file);
    formData.append("title_give", title);
    formData.append("comment_give", comment);
    formData.append("day_give", day);
    formData.append("now", now);

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
    window.location.href = '/login';
});