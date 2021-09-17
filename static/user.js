    const openPost = async (id) => {
        const response = await fetch(`/p/${id}`);
        const {
            post: {
                post_comment: comment,
                post_day: visitedDay,
                post_pic_real: postImagePath,
                post_title: title,
                profile_name: nickname,
                username
            },
            user: { profile_pic_real: profileImagePath }} = await response.json();

        const wrapper = document.createElement('div');
        wrapper.classList.add('modal', 'is-active');
        wrapper.id = 'post-detail';

        const postBackground = document.createElement('div');
        postBackground.classList.add('modal-background', 'post-detail__background');
        postBackground.addEventListener('click', () => wrapper.remove());
        wrapper.append(postBackground);

        const contents = `
            <div class="modal-content post__modal-content p">
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
                    </div>
                    <div class="p__description__bottom-column">
                        <p>${visitedDay}</p>
                        <p>${title}을 드셨어요.</p>
                        <p>${comment}</p>
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
        return;
    };

    const deleteAccount = (username) => {
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

    const modifyUserInformation = (username) => {
        const { value: nick_value } = document.getElementById('setting__nick');
        const [file_value] = document.getElementById('setting__profile-picture').files;
        const { value: about_value } = document.getElementById('setting__info');

        const formData = new FormData();
        const groupData = {
            nick_give: nick_value,
            file_give: file_value,
            about_give: about_value
        };

        for (const key in groupData) {
            if (!groupData[key]) {
                delete groupData[key];
            }
        }

        for (const [key, value] of Object.entries(groupData)) {
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
    };
$('.logout-button').on('click', () => {
    $.removeCookie('mytoken', {path: '/'});
    window.location.href = '/login'
});
    // REMAININGTASK: 업데이트 로직 구현.
    // document.querySelector('.post__heart-icon')
    //     .addEventListener('click', () => { console.log('hello'); });