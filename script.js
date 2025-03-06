// ✅ 사용자 정보
let USER_ID = "";
let USER_PW = "";
let USER_TOKEN = localStorage.getItem("USER_TOKEN") || "";  // 저장된 토큰 불러오기
let ROOM_ID = 102;
let stopFlag = false;

// ✅ 1. 로그인 기능 (login.html)
async function login() {
    USER_ID = document.getElementById("userId").value;
    USER_PW = document.getElementById("userPw").value;

    if (!USER_ID || !USER_PW) {
        document.getElementById("status").innerText = "❌ 아이디와 비밀번호를 입력하세요!";
        return;
    }

    document.getElementById("status").innerText = "🔄 로그인 중...";

    try {
        let response = await fetch("https://library.konkuk.ac.kr/pyxis-api/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json;charset=UTF-8" },
            body: JSON.stringify({
                loginId: USER_ID,
                password: USER_PW,
                isFamilyLogin: false,
                isMobile: true
            })
        });

        let loginData = await response.json();

        if (loginData.success) {
            USER_TOKEN = loginData.data.accessToken;
            localStorage.setItem("USER_TOKEN", USER_TOKEN);  // ✅ 로그인 정보 저장

            document.getElementById("status").innerText = "✅ 로그인 성공! 페이지 이동 중...";
            
            setTimeout(() => {
                window.location.href = "index.html";  // ✅ 좌석 예약 페이지로 이동
            }, 1000);
        } else {
            document.getElementById("status").innerText = "❌ 로그인 실패!";
        }
    } catch (error) {
        document.getElementById("status").innerText = "❌ 로그인 오류 발생!";
    }
}

// ✅ 2. Seat Ninja 시작 (seat.html)
async function startSeatNinja(mode) {
    USER_TOKEN = localStorage.getItem("USER_TOKEN");  // ✅ 저장된 로그인 정보 불러오기

    if (!USER_TOKEN) {
        document.getElementById("status").innerText = "❌ 로그인 정보가 없습니다! 다시 로그인하세요.";
        setTimeout(() => {
            window.location.href = "login.html";  // 로그인 페이지로 이동
        }, 2000);
        return;
    }

    document.getElementById("status").innerText = "🔄 로그인 확인 완료...";

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

    await reserveSeat(seatNumber);
}

// ✅ 3. 좌석 예약 함수
async function reserveSeat(seatId = null) {
    if (!USER_TOKEN) {
        document.getElementById("status").innerText = "❌ 로그인 정보가 없습니다!";
        return;
    }

    try {
        let url = seatId ? 
            `https://library.konkuk.ac.kr/pyxis-api/1/api/seat-charges` :
            `https://library.konkuk.ac.kr/pyxis-api/1/api/rooms/${ROOM_ID}/seats`;

        let method = seatId ? "POST" : "GET";

        let response = await fetch(url, {
            method: method,
            headers: { 
                "Content-Type": "application/json;charset=UTF-8",
                "pyxis-auth-token": USER_TOKEN
            },
            body: seatId ? JSON.stringify({ seatId: seatId, smufMethodCode: "MOBILE" }) : null
        });

        let data = await response.json();

        if (seatId) {
            if (data.success) {
                document.getElementById("status").innerText = `✅ 좌석 ${seatId} 예약 성공!`;
                await confirmSeat(data.data.id);
            } else {
                document.getElementById("status").innerText = `❌ 예약 실패: ${data.message}`;
            }
        } else {
            let availableSeats = data.data.list.filter(seat => !seat.isOccupied);

            if (availableSeats.length === 0) {
                document.getElementById("status").innerText = "🔄 빈자리 없음, 다시 탐색 중...";
                await new Promise(resolve => setTimeout(resolve, 10000));
                return reserveSeat();
            }

            let targetSeat = availableSeats[0];
            document.getElementById("status").innerText = `🎯 빈자리 발견! 좌석 ${targetSeat.id} 예약 시도...`;

            await reserveSeat(targetSeat.id);
        }
    } catch (error) {
        document.getElementById("status").innerText = "❌ 오류 발생!";
    }
}

// ✅ 4. 배석 확정
async function confirmSeat(reservationId) {
    await fetch(`https://library.konkuk.ac.kr/pyxis-api/1/api/seat-charges/${reservationId}?smufMethodCode=MOBILE&_method=put`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json;charset=UTF-8",
            "pyxis-auth-token": USER_TOKEN
        }
    });

    document.getElementById("status").innerText = "✅ 배석 확정 완료!";
}

// 🛑 실행 중지
function stopLoop() {
    stopFlag = true;
    document.getElementById("status").innerText = "🛑 예약 중지됨.";
}

// ✅ 5. 페이지 로드시 로그인 정보 확인
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes("seat.html")) {
        USER_TOKEN = localStorage.getItem("USER_TOKEN");
        if (!USER_TOKEN) {
            document.getElementById("status").innerText = "❌ 로그인 정보 없음. 로그인 페이지로 이동합니다.";
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        }
    }
});
