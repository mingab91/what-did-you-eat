/**
 @param {string} username - userID
 @return {void}
 @description - 1. 유저로부터 받은 form 데이터들 중 실제로 있는 부분만 추려내어 PATCH 요청의 body로 보냅니다.
                2. 이후 응답 상태에 따라 다른 메세지를 출력하고, 다른 페이지로 이동합니다.
 */

function modifyUserInformation (username) {
    // form controls의 value는 undefined일 수 있고 아닐 수 있습니다.
    const { value: nick_value } = document.getElementById('setting__nick');
    const [file_value] = document.getElementById('setting__profile-picture').files;
    const { value: about_value } = document.getElementById('setting__info');

    const formData = new FormData();
    const inputData = {
        nick_give: nick_value,
        file_give: file_value,
        about_give: about_value
    };

    // 따라서 값이 undefined일 때 프로퍼티를 동적으로 지워주어 가공을 합니다.
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
            alert(msg);
            if (result === 'success') {
                window.location.reload();
            } else {
                window.location.href = '/';
            }
        }
    });
}

/**
 @param {string} username - userID
 @return {void}
 @description - 1. userID를 url Variable에 담아 DELETE 요청을 보낸 후 응답 결과에 따라 다른 페이지로 이동하는 로직입니다.
                2. 계정을 지울 때 토큰을 담은 쿠키도 같이 지웁니다.
 */

function deleteAccount (username) {
    $.ajax({
        type: "DELETE",
        url:  `/user/${username}`,
        data: {},
        success: function ({ result, message }) {
            alert(message);
            if (result === 'success') {
                $.removeCookie('mytoken', {path: '/'});
                window.location.href = '/login';
            } else {
                window.location.href = '/';
            }
        }
    });
}

/**
 @param {string} postId - stringified ObjectID for the post document
 @return {void}
 @description - 1. 포스팅 상세 페이지에서 한줄평의 내용을 수정할 수 있게끔 input과 그에 따른 부가정보를 렌더링하는 로직입니다.
                2. 수정 버튼을 클릭하여 input이 이미 한 번 렌더링이 되었다면, 추가적인 생성을 방지하고자 얼리 리턴해줍니다.
                3. 그러지 않은 경우 엘리먼트를 생성하여 렌더링합니다.
                4. 버튼 요소는 PATCH를 보낼 수 있는 이벤트 핸들러를 달아줍니다.
 */

function openModifier (postId) {
    if (document.querySelector('.modifier__wrapper')) {
        return;
    }
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

/**
 @param {string} id - stringified Object Id received from Request[GET]
 @return {void}
 @description - 1. 유저페이지에서 포스트 박스를 클릭할 때 상세 페이지를 렌더링합니다.
                2. 서버로부터 status 변수를 통하여 동적으로 html을 렌더링합니다.
 */

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

    // Bulma framework의 modal 컴포넌트를 바탕으로 작성하였습니다..
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

    // 리플로우를 최소화하기위하여 fragment를 사용하였습니다.
    const fragment = document.createDocumentFragment();
    fragment.appendChild(wrapper);
    document.querySelector('.user').appendChild(fragment);
}


/**
 @param {string} postId - stringified ObjectID for the post document
 @return {void}
 @description - 서버에 DELETE 요청을 보내어 응답에 따라 다른 페이지로 이동하는 간단한 로직입니다.
 */

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