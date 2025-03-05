// 🚀 Seat Ninja - 웹버전 (로그인 + 예약 + 내 정보 + 배석 취소)

// ✅ 사용자 정보 변수
let USER_ID = "";
let USER_PW = "";
let USER_TOKEN = "";
let ROOM_ID = 102;
let stopFlag = false;

// ✅ 로그인 정보 저장
function saveLoginInfo() {
    USER_ID = document.getElementById("userId").value;
    USER_PW = document.getElementById("userPw").value;

    if (!USER_ID || !USER_PW) {
        alert("❌ 아이디와 비밀번호를 입력하세요!");
        return;
    }

    localStorage.setItem("userId", USER_ID);
    localStorage.setItem("userPw", USER_PW);

    document.getElementById("status").innerText = "✅ 로그인 정보 저장 완료!";
}

// ✅ Seat Ninja 시작 (사용자 선택)
async function startSeatNinja(mode) {
    USER_ID = localStorage.getItem("userId");
    USER_PW = localStorage.getItem("userPw");

    if (!USER_ID || !USER_PW) {
        alert("❌ 먼저 로그인 정보를 입력하세요!");
        return;
    }

    document.getElementById("status").innerText = "🔄 로그인 중...";
    let seatNumber = null;

    if (mode === 1) {
        seatNumber = prompt("🎯 예약할 좌석 번호 입력: ");
        if (!seatNumber) {
            alert("❌ 좌석 번호를 입력해야 합니다!");
            return;
        }
        document.getElementById("status").innerText = `🎯 특정 좌석 ${seatNumber} 예약 시도 중...`;
    } else {
        document.getElementById("status").innerText = "🔄 빈자리 탐색 중...";
    }

    await loginAndGetToken(seatNumber);
}

// ✅ 로그인 후 토큰 가져오기
async function loginAndGetToken(seatId = null) {
    try {
        let response = await fetch("https://library.konkuk.ac.kr/pyxis-api/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json;charset=UTF-8" },
            body: JSON.stringify({ loginId: USER_ID, password: USER_PW, isFamilyLogin: false, isMobile: true })
        });

        let loginData = await response.json();

        if (loginData.success) {
            USER_TOKEN = loginData.data.accessToken;
            document.getElementById("status").innerText = "✅ 로그인 성공!";
            localStorage.setItem("pyxis-auth-token", USER_TOKEN);
            loadUserInfo();

            if (seatId) {
                reserveSpecificSeat(seatId);
            } else {
                findAndReserveSeat();
            }
        } else {
            document.getElementById("status").innerText = "❌ 로그인 실패!";
        }
    } catch (error) {
        document.getElementById("status").innerText = "❌ 로그인 오류!";
    }
}

// ✅ 사용자 정보 불러오기
async function loadUserInfo() {
    try {
        let response = await fetch("https://library.konkuk.ac.kr/pyxis-api/1/api/my-info", {
            method: "GET",
            headers: { "Content-Type": "application/json;charset=UTF-8", "pyxis-auth-token": USER_TOKEN }
        });

        let data = await response.json();

        if (data.success) {
            document.getElementById("userName").innerText = data.data.name;
            document.getElementById("userStudentId").innerText = data.data.memberNo;
            document.getElementById("userSeat").innerText = data.data.currentSeat ? data.data.currentSeat.code : "예약 없음";
        }
    } catch (error) {
        document.getElementById("status").innerText = "❌ 사용자 정보 불러오기 실패!";
    }
}

// ✅ 특정 좌석 예약
async function reserveSpecificSeat(seatId) {
    try {
        let response = await fetch("https://library.konkuk.ac.kr/pyxis-api/1/api/seat-charges", {
            method: "POST",
            headers: { "Content-Type": "application/json;charset=UTF-8", "pyxis-auth-token": USER_TOKEN },
            body: JSON.stringify({ seatId: seatId, smufMethodCode: "MOBILE" })
        });

        let reserveData = await response.json();

        if (reserveData.success) {
            document.getElementById("status").innerText = `✅ 좌석 ${seatId} 예약 성공!`;
            await confirmSeat(reserveData.data.id);
        }
    } catch (error) {
        document.getElementById("status").innerText = "❌ 예약 오류!";
    }
}

// ✅ 빈자리 탐색
async function findAndReserveSeat() {
    while (!stopFlag) {
        try {
            let response = await fetch(`https://library.konkuk.ac.kr/pyxis-api/1/api/rooms/${ROOM_ID}/seats`, {
                method: "GET",
                headers: { "Content-Type": "application/json;charset=UTF-8", "pyxis-auth-token": USER_TOKEN }
            });

            let data = await response.json();
            let availableSeats = data.data.list.filter(seat => !seat.isOccupied);

            if (availableSeats.length > 0) {
                await reserveSpecificSeat(availableSeats[0].id);
                break;
            }
        } catch (error) {}

        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

// ✅ 배석 취소 기능
async function cancelReservation() {
    let seatCode = document.getElementById("userSeat").innerText;
    if (seatCode === "예약 없음") return;

    await fetch("https://library.konkuk.ac.kr/pyxis-api/1/api/cancel-seat", {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8", "pyxis-auth-token": USER_TOKEN }
    });

    document.getElementById("userSeat").innerText = "예약 없음";
}

// ✅ 예약 중지
function stopLoop() {
    stopFlag = true;
    document.getElementById("status").innerText = "🛑 예약 중지됨.";
}
