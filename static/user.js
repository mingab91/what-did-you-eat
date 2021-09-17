async function openPost (id) {
    const response = await fetch(`/p/${id}`);
    const {
        post: {
            post_comment: comment,
            post_day: visitedDay,
            post_pic_real: postImagePath,
            post_title: title,
            profile_name: nickname,
            username,
        },
        user: { profile_pic_real: profileImagePath },
        status } = await response.json();

    const wrapper = document.createElement('div');
    wrapper.classList.add('modal', 'is-active');
    wrapper.id = 'post-detail';

    const postBackground = document.createElement('div');
    postBackground.classList.add('modal-background', 'post-detail__background');
    postBackground.addEventListener('click', () => wrapper.remove());
    wrapper.append(postBackground);

    const contents = `
        <div id="${id}" class="modal-content post__modal-content p">
            <div class="p__left-column">
                <img src="/static/${postImagePath}" alt="Placeholder image" class="post__image post__image--lg">
            </div>
            <div class="p__right-column p__description description">
                <div class="description__column-top description__user">
                    <div>
                        <img src="/static/${profileImagePath}" class="image is-48x48 description__user-picture">
                    </div>
                    <div class="description__user-info">
                        <h5>@${username}</h5>
                        <p>${nickname}</p>
                    </div>
                    ${status ? (`
                        <div class="description__buttons">
                            <span class="description__button--modify" onclick="openModifier('${id}')">
                                <i class="fas fa-pen"></i>
                            </span>
                            <span class="description__button--delete" onclick="deletePost('${id}')">
                                <i class="fas fa-trash-alt"></i>
                            </span>
                        </div>`)
                    : ''}
                </div>
                <div class="p__description__column-bottom">
                    <p>방문 날짜: ${visitedDay}</p>
                    <p>먹은 음식: ${title}</p>
                    <p class="description__comment">한줄평: ${comment}</p>
                </div>
            </div>
        </div>
    `.trim();
    wrapper.insertAdjacentHTML('beforeend', contents);

    const closeButton = document.createElement('div');
    closeButton.classList.add('modal-close', 'is-large', 'post-modal__close');
    closeButton.addEventListener('click', () => wrapper.remove());
    wrapper.append(closeButton);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(wrapper);
    document.querySelector('.user').appendChild(fragment);
}

function deleteAccount (username) {
    $.ajax({
        type: "DELETE",
        url:  `/user/${username}`,
        data: {},
        success: function (response) {
            if (response.result === 'success') {
                  $.removeCookie('mytoken', {path: '/'});
                  alert(response.message);
                  window.location.href = '/login';
            }
        }
    });
}

function modifyUserInformation (username) {
    const { value: nick_value } = document.getElementById('setting__nick');
    const [file_value] = document.getElementById('setting__profile-picture').files;
    const { value: about_value } = document.getElementById('setting__info');

    const formData = new FormData();
    const inputData = {
        nick_give: nick_value,
        file_give: file_value,
        about_give: about_value
    };

    for (const key in inputData) {
        if (!inputData[key]) {
            delete inputData[key];
        }
    }

    for (const [key, value] of Object.entries(inputData)) {
        formData.append(key, value);
    }

    $.ajax({
        type: "PATCH",
        url: `/user/${username}`,
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        success: function ({ result, msg }) {
            if (result === 'success') {
                alert(msg);
                window.location.reload();
            }
        }
    });
}

function openModifier (postId) {
    const comment = document.querySelector('.description__comment');
    const parent = document.querySelector('.p__description__column-bottom');
    const wrapper = document.createElement('div');
    wrapper.classList.add('modifier__wrapper');
    const input = document.createElement('input');
    const button = document.createElement('button');
    const small = document.createElement('small');
    small.textContent = '한줄평만 수정이 가능합니다.';
    small.classList.add('modifier__helper');

    input.type = 'text';
    input.classList.add('description__modifier');
    button.classList.add('button', 'is-primary', 'modifier__button');
    button.textContent = '수정하기!';

    wrapper.append(small, input, button);
    button.addEventListener('click', function () {
        $.ajax({
            type: 'PATCH',
            url: `/p/${postId}`,
            data: {
                comment_give: input.value
            },
            success: function ({ result, msg }) {
                alert(msg);
                if (result === 'success') {
                    wrapper.remove();
                    comment.textContent = '한줄평: ' + input.value;
                } else {
                    window.location.href = '/';
                }
            }
        });
    });
    parent.appendChild(wrapper);
}

 function deletePost (postId) {
    $.ajax({
        type: 'DELETE',
        url: `/p/${postId}`,
        data: {},
        success: function ({result, msg, userId}) {
            alert(msg);
            if (result === 'success') {
                window.location.href = `/user/${userId}`;
            } else {
                window.location.href = '/';
            }
        }
    });
};