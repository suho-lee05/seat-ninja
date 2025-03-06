// 🚀 Seat Ninja - 웹버전 (건국대 도서관 예약)

// ✅ 사용자 정보 (수정 가능)
let USER_ID = "suhoi6791";  
let USER_PW = "@kiljae5451";  
let USER_TOKEN = "";  
let ROOM_ID = 102;  
let stopFlag = false;  

// ✅ 1. Seat Ninja 시작 (사용자 선택)
async function startSeatNinja(mode) {
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

// ✅ 2. 로그인 후 토큰 가져오기
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

// ✅ 3. 특정 좌석 예약
async function reserveSpecificSeat(seatId) {
    try {
        let response = await fetch("https://library.konkuk.ac.kr/pyxis-api/1/api/seat-charges", {
            method: "POST",
            headers: { "Content-Type": "application/json;charset=UTF-8", "pyxis-auth-token": USER_TOKEN },
            body: JSON.stringify({ seatId: seatId, smufMethodCode: "MOBILE" })
        });

        let reserveData = await response.json();

        if (reserveData.success) {
            let reservationId = reserveData.data.id;  
            document.getElementById("status").innerText = `✅ 좌석 ${seatId} 예약 성공!`;
            await confirmSeat(reservationId);
        } else {
            document.getElementById("status").innerText = `❌ 예약 실패: ${reserveData.message}`;
        }
    } catch (error) {
        document.getElementById("status").innerText = "❌ 예약 오류!";
    }
}

// ✅ 4. 빈자리 자동 탐색
async function findAndReserveSeat() {
    while (!stopFlag) {  
        document.getElementById("status").innerText = "🔄 빈자리 탐색 중...";

        try {
            let response = await fetch(`https://library.konkuk.ac.kr/pyxis-api/1/api/rooms/${ROOM_ID}/seats`, {
                method: "GET",
                headers: { "Content-Type": "application/json;charset=UTF-8", "pyxis-auth-token": USER_TOKEN }
            });

            let data = await response.json();
            let availableSeats = data.data.list.filter(seat => !seat.isOccupied);

            if (availableSeats.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }

            let targetSeat = availableSeats[0];  
            document.getElementById("status").innerText = `🎯 빈자리 발견! 좌석 ${targetSeat.id} 예약 시도...`;

            let reserveResponse = await fetch("https://library.konkuk.ac.kr/pyxis-api/1/api/seat-charges", {
                method: "POST",
                headers: { "Content-Type": "application/json;charset=UTF-8", "pyxis-auth-token": USER_TOKEN },
                body: JSON.stringify({ seatId: targetSeat.id, smufMethodCode: "MOBILE" })
            });

            let reserveData = await reserveResponse.json();

            if (reserveData.success) {
                let reservationId = reserveData.data.id;
                document.getElementById("status").innerText = `✅ 좌석 ${targetSeat.id} 예약 성공!`;
                await confirmSeat(reservationId);
                break;
            }
        } catch (error) {
            document.getElementById("status").innerText = "❌ 오류 발생!";
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

// ✅ 5. 배석 확정
async function confirmSeat(reservationId) {
    await fetch(`https://library.konkuk.ac.kr/pyxis-api/1/api/seat-charges/${reservationId}?smufMethodCode=MOBILE&_method=put`, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8", "pyxis-auth-token": USER_TOKEN }
    });

    document.getElementById("status").innerText = "✅ 배석 확정 완료!";
}

// 🛑 실행 중지
function stopLoop() {
    stopFlag = true;
    document.getElementById("status").innerText = "🛑 예약 중지됨.";
}
