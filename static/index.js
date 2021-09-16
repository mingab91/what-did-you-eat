(function init() {
    $('.logout-button').on('click', () => {
        $.removeCookie('mytoken', {path: '/'});
        console.log('done');
        window.location.href = '/login'
    });
}());

