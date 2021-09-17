function sign_in() {
    const username = $("#input-username").val();
    const password = $("#input-password").val();

    if (!username) {
        $("#help-id-login").text("아이디를 입력해주세요.");
        $("#input-username").focus();
        return;
    }

    $("#help-id-login").text("");

    if (!password) {
        $("#help-password-login").text("비밀번호를 입력해주세요.");
        $("#input-password").focus();
        return;
    }

    $("#help-password-login").text("");

    $.ajax({
        type: "POST",
        url: "/sign_in",
        data: {
            username_give: username,
            password_give: password
        },
        success: function (response) {
            if (response['result'] === 'success') {
                $.cookie('mytoken', response['token'], {path: '/'});
                window.location.replace("/");
            } else {
                alert(response['msg']);
            }
        }
    });
}

function is_password(asValue) {
    const regExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z!@#$%^&*]{8,20}$/;
    return regExp.test(asValue);
}

function sign_up() {
    const username = $("#input-username").val();
    const password = $("#input-password").val();
    const password2 = $("#input-password2").val();
    const profile_name = $("#input-profile_name").val();

    if ($("#help-id").hasClass("is-danger")) {
        alert("아이디를 다시 확인해주세요.");
        return;
    }

    if (!$("#help-id").hasClass("is-success")) {
        alert("아이디 중복확인을 해주세요.");
        return;
    }

    if (!password) {
        $("#help-password").text("비밀번호를 입력해주세요.").removeClass("is-safe").addClass("is-danger");
        $("#input-password").focus();
        return;
    }

    if (!is_password(password)) {
        $("#help-password")
            .text("비밀번호의 형식을 확인해주세요. 영문과 숫자 필수 포함, 특수문자(!@#$%^&*) 사용가능 8-20자")
            .removeClass("is-safe").addClass("is-danger");
        $("#input-password").focus();
        return;
    }
    $("#help-password").text("사용할 수 있는 비밀번호입니다.").removeClass("is-danger").addClass("is-success");

    if (!password2) {
        $("#help-password2").text("비밀번호를 입력해주세요.").removeClass("is-safe").addClass("is-danger");
        $("#input-password2").focus();
        return;
    }

    if (password2 !== password) {
        $("#help-password2").text("비밀번호가 일치하지 않습니다.").removeClass("is-safe").addClass("is-danger");
        $("#input-password2").focus();
        return;
    }

    $("#help-password2").text("비밀번호가 일치합니다.").removeClass("is-danger").addClass("is-success");

    if (!profile_name) {
        $("#help-profile_name").text("닉네임을 입력해주세요.").removeClass("is-safe").addClass("is-danger");
        $("#help-profile_name").focus();
        return;
    }

    $("#help-profile_name").text("사용할 수 있는 닉네임입니다.").removeClass("is-danger").addClass("is-success");

    $.ajax({
        type: "POST",
        url: "/sign_up/save",
        data: {
            username_give: username,
            password_give: password,
            profile_name_receive: profile_name

        },
        success: function (response) {
            alert("회원가입을 축하드립니다!");
            window.location.replace("/login");
        }
    });
}

function toggle_sign_up() {
    $("#sign-up-box").toggleClass("is-hidden");
    $("#div-sign-in-or-up").toggleClass("is-hidden");
    $("#btn-check-dup").toggleClass("is-hidden");
    $("#help-id").toggleClass("is-hidden");
    $("#help-password").toggleClass("is-hidden");
    $("#help-password2").toggleClass("is-hidden");
    $("#help-profile_name").toggleClass("is-hidden");
}

function is_nickname(asValue) {
    const regExp = /^(?=.*[a-zA-Z])[-a-zA-Z0-9_.]{2,10}$/;
    return regExp.test(asValue);
}

function check_dup() {
    const username = $("#input-username").val();

    if (!username) {
        $("#help-id").text("아이디를 입력해주세요.").removeClass("is-safe").addClass("is-danger");
        $("#input-username").focus();
        return;
    }
    if (!is_nickname(username)) {
        $("#help-id").text("아이디의 형식을 확인해주세요. 영문과 숫자, 일부 특수문자(._-) 사용 가능. 2-10자 길이")
            .removeClass("is-safe").addClass("is-danger");
        $("#input-username").focus();
        return;
    }

    $("#help-id").addClass("is-loading");

    $.ajax({
        type: "POST",
        url: "/sign_up/check_dup",
        data: { username_give: username},
        success: function (response) {

            if (response["exists"]) {
                $("#help-id").text("이미 존재하는 아이디입니다.").removeClass("is-safe").addClass("is-danger");
                $("#input-username").focus();
            } else {
                $("#help-id").text("사용할 수 있는 아이디입니다.").removeClass("is-danger").addClass("is-success");
            }
            $("#help-id").removeClass("is-loading");
        }
    });
}

