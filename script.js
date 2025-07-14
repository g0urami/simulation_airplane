78% of storage used … If you run out of space, you can't save to Drive or use Gmail. Get 100 GB of storage for ₩2,400 ₩600/month for 3 months.
// DOM 요소 참조
document.addEventListener('DOMContentLoaded', function() {
    // 컨트롤 요소
    const aircraftModel = document.getElementById('aircraft-model');
    const speedSlider = document.getElementById('speed');
    const altitudeSlider = document.getElementById('altitude');
    const angleSlider = document.getElementById('angle');
    const windSpeedSlider = document.getElementById('wind-speed');
    const startButton = document.getElementById('start-simulation');
    const resetButton = document.getElementById('reset-simulation');
    
    // 값 표시 요소
    const speedValue = document.getElementById('speed-value');
    const altitudeValue = document.getElementById('altitude-value');
    const angleValue = document.getElementById('angle-value');
    const windSpeedValue = document.getElementById('wind-speed-value');
    
    // 데이터 표시 요소
    const liftValue = document.getElementById('lift-value');
    const dragValue = document.getElementById('drag-value');
    const thrustValue = document.getElementById('thrust-value');
    const gravityValue = document.getElementById('gravity-value');
    
    // 캔버스 설정
    const canvas = document.getElementById('simulation-canvas');
    const ctx = canvas.getContext('2d');
    
    // 캔버스 크기 설정
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    
    // 초기 캔버스 크기 설정
    resizeCanvas();
    
    // 창 크기 변경 시 캔버스 크기 조정
    window.addEventListener('resize', resizeCanvas);
    
    // 슬라이더 값 변경 시 표시 업데이트
    speedSlider.addEventListener('input', function() {
        speedValue.textContent = this.value;
        updateSimulation();
    });
    
    altitudeSlider.addEventListener('input', function() {
        altitudeValue.textContent = this.value;
        updateSimulation();
    });
    
    angleSlider.addEventListener('input', function() {
        angleValue.textContent = this.value;
        updateSimulation();
    });
    
    windSpeedSlider.addEventListener('input', function() {
        windSpeedValue.textContent = this.value;
        updateSimulation();
    });
    
    // 항공기 모델 변경 시 업데이트
    aircraftModel.addEventListener('change', updateSimulation);
    
    // 시뮬레이션 시작 버튼
    startButton.addEventListener('click', startSimulation);
    
    // 초기화 버튼
    resetButton.addEventListener('click', resetSimulation);
    
    // 시뮬레이션 상태
    let isSimulationRunning = false;
    let animationFrameId = null;
    
    // 항공기 데이터
    const aircraftData = {
        cessna: {
            mass: 1000,  // kg
            wingArea: 16,  // m^2
            liftCoefficient: 0.1,
            dragCoefficient: 0.027
        },
        boeing: {
            mass: 41000,  // kg
            wingArea: 125,  // m^2
            liftCoefficient: 0.2,
            dragCoefficient: 0.024
        },
        fighter: {
            mass: 12000,  // kg
            wingArea: 27,  // m^2
            liftCoefficient: 0.25,
            dragCoefficient: 0.016
        }
    };
    
    // 시뮬레이션 상태 객체
    let simulation = {
        aircraft: null,
        speed: 0,
        altitude: 0,
        angle: 0,
        windSpeed: 0,
        lift: 0,
        drag: 0,
        thrust: 0,
        gravity: 0,
        x: 0,
        y: 0
    };
    
    // 시뮬레이션 업데이트 함수
    function updateSimulation() {
        const model = aircraftModel.value;
        const speed = parseInt(speedSlider.value);
        const altitude = parseInt(altitudeSlider.value);
        const angle = parseInt(angleSlider.value);
        const windSpeed = parseInt(windSpeedSlider.value);
        
        simulation.aircraft = aircraftData[model];
        simulation.speed = speed;
        simulation.altitude = altitude;
        simulation.angle = angle;
        simulation.windSpeed = windSpeed;
        
        // 물리량 계산
        calculatePhysics();
        
        // 캔버스 업데이트
        drawSimulation();
        
        // 데이터 표시 업데이트
        updateDataDisplay();
    }
    
    // 물리량 계산 함수
    function calculatePhysics() {
        const airDensity = 1.225 * Math.exp(-simulation.altitude / 10000);  // 고도에 따른 공기 밀도
        const effectiveSpeed = simulation.speed + simulation.windSpeed;  // 상대 속도
        const angleRad = simulation.angle * Math.PI / 180;  // 라디안 변환
        
        // 양력 계산: 0.5 * 공기밀도 * 속도^2 * 날개면적 * 양력계수 * sin(받음각)
        simulation.lift = 0.5 * airDensity * Math.pow(effectiveSpeed, 2) * 
                          simulation.aircraft.wingArea * 
                          simulation.aircraft.liftCoefficient * 
                          Math.sin(angleRad + 0.1);  // 기본 양력을 위해 0.1 추가
        
        // 항력 계산: 0.5 * 공기밀도 * 속도^2 * 날개면적 * 항력계수
        simulation.drag = 0.5 * airDensity * Math.pow(effectiveSpeed, 2) * 
                          simulation.aircraft.wingArea * 
                          simulation.aircraft.dragCoefficient * 
                          (1 + Math.sin(angleRad) * 5);  // 받음각에 따른 항력 증가
        
        // 중력 계산: 질량 * 중력가속도
        simulation.gravity = simulation.aircraft.mass * 9.8;
        
        // 추력 계산 (간단히 항력과 중력을 고려한 값으로 설정)
        simulation.thrust = simulation.drag + simulation.gravity * Math.sin(angleRad);
        if (simulation.thrust < 0) simulation.thrust = 0;
    }
    
    // 데이터 표시 업데이트 함수
    function updateDataDisplay() {
        liftValue.textContent = Math.round(simulation.lift) + ' N';
        dragValue.textContent = Math.round(simulation.drag) + ' N';
        thrustValue.textContent = Math.round(simulation.thrust) + ' N';
        gravityValue.textContent = Math.round(simulation.gravity) + ' N';
    }
    
    // 시뮬레이션 그리기 함수
    function drawSimulation() {
        // 캔버스 지우기
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 배경 - 하늘
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');  // 하늘색
        skyGradient.addColorStop(1, '#E0F7FF');  // 연한 하늘색
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 지면 그리기 (고도에 따라 위치 조정)
        const groundY = canvas.height - (simulation.altitude / 50);
        if (groundY < canvas.height) {
            ctx.fillStyle = '#8B4513';  // 갈색 지면
            ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
        }
        
        // 항공기 위치 계산
        const aircraftX = canvas.width / 2;
        const aircraftY = canvas.height / 2;
        
        // 항공기 그리기
        ctx.save();
        ctx.translate(aircraftX, aircraftY);
        ctx.rotate(simulation.angle * Math.PI / 180);
        
        // 항공기 모델에 따라 다른 모양 그리기
        switch(aircraftModel.value) {
            case 'cessna':
                drawCessna(ctx);
                break;
            case 'boeing':
                drawBoeing(ctx);
                break;
            case 'fighter':
                drawFighter(ctx);
                break;
        }
        
        // 힘 벡터 그리기
        if (isSimulationRunning) {
            drawForceVectors(ctx);
        }
        
        ctx.restore();
    }
    
    // 세스나 그리기 함수
    function drawCessna(ctx) {
        // 동체
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, 0, 50, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 날개
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(-40, 0);
        ctx.lineTo(-60, 15);
        ctx.lineTo(60, 15);
        ctx.lineTo(40, 0);
        ctx.lineTo(30, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 꼬리 날개
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(60, 0);
        ctx.lineTo(70, -15);
        ctx.lineTo(60, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // 보잉 그리기 함수
    function drawBoeing(ctx) {
        // 동체
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, 0, 70, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 날개
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-50, 0);
        ctx.lineTo(-80, 20);
        ctx.lineTo(80, 20);
        ctx.lineTo(50, 0);
        ctx.lineTo(40, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 꼬리 날개
        ctx.beginPath();
        ctx.moveTo(50, 0);
        ctx.lineTo(70, 0);
        ctx.lineTo(90, -25);
        ctx.lineTo(80, -25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 엔진
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.ellipse(-30, 10, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(30, 10, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 전투기 그리기 함수
    function drawFighter(ctx) {
        // 동체
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.ellipse(0, 0, 60, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 날개 (삼각형)
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(-40, 25);
        ctx.lineTo(40, 25);
        ctx.lineTo(20, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 꼬리 날개
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(60, 0);
        ctx.lineTo(50, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // 힘 벡터 그리기 함수
    function drawForceVectors(ctx) {
        const scale = 0.01;  // 벡터 크기 조절 계수
        
        // 양력 벡터 (위쪽)
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -simulation.lift * scale);
        ctx.stroke();
        
        // 중력 벡터 (아래쪽)
        ctx.strokeStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, simulation.gravity * scale);
        ctx.stroke();
        
        // 추력 벡터 (앞쪽)
        ctx.strokeStyle = '#0000FF';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(simulation.thrust * scale, 0);
        ctx.stroke();
        
        // 항력 벡터 (뒤쪽)
        ctx.strokeStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-simulation.drag * scale, 0);
        ctx.stroke();
    }
    
    // 시뮬레이션 시작 함수
    function startSimulation() {
        if (isSimulationRunning) return;
        
        isSimulationRunning = true;
        startButton.textContent = '시뮬레이션 일시정지';
        startButton.removeEventListener('click', startSimulation);
        startButton.addEventListener('click', pauseSimulation);
        
        // 애니메이션 루프 시작
        animationLoop();
    }
    
    // 시뮬레이션 일시정지 함수
    function pauseSimulation() {
        isSimulationRunning = false;
        startButton.textContent = '시뮬레이션 시작';
        startButton.removeEventListener('click', pauseSimulation);
        startButton.addEventListener('click', startSimulation);
        
        // 애니메이션 루프 중지
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
    
    // 시뮬레이션 초기화 함수
    function resetSimulation() {
        // 시뮬레이션 중지
        pauseSimulation();
        
        // 슬라이더 초기화
        speedSlider.value = 200;
        speedValue.textContent = '200';
        
        altitudeSlider.value = 1000;
        altitudeValue.textContent = '1000';
        
        angleSlider.value = 0;
        angleValue.textContent = '0';
        
        windSpeedSlider.value = 0;
        windSpeedValue.textContent = '0';
        
        // 항공기 모델 초기화
        aircraftModel.value = 'cessna';
        
        // 시뮬레이션 업데이트
        updateSimulation();
    }
    
    // 애니메이션 루프
    function animationLoop() {
        if (!isSimulationRunning) return;
        
        // 물리량 업데이트
        calculatePhysics();
        
        // 캔버스 업데이트
        drawSimulation();
        
        // 데이터 표시 업데이트
        updateDataDisplay();
        
        // 다음 프레임 요청
        animationFrameId = requestAnimationFrame(animationLoop);
    }
    
    // 이론 섹션 애니메이션 초기화
    initTheoryAnimations();
    
    // 초기 시뮬레이션 설정
    resetSimulation();
    
    // 이론 섹션 애니메이션 초기화 함수
    function initTheoryAnimations() {
        // 베르누이 원리 애니메이션
        const bernoulliElement = document.getElementById('bernoulli-animation');
        if (bernoulliElement) {
            const bernoulliCanvas = document.createElement('canvas');
            bernoulliCanvas.width = bernoulliElement.clientWidth;
            bernoulliCanvas.height = bernoulliElement.clientHeight;
            bernoulliElement.appendChild(bernoulliCanvas);
            
            const bernCtx = bernoulliCanvas.getContext('2d');
            
            // 베르누이 원리 애니메이션 함수
            function animateBernoulli() {
                bernCtx.clearRect(0, 0, bernoulliCanvas.width, bernoulliCanvas.height);
                
                // 날개 단면 그리기
                bernCtx.fillStyle = '#3498db';
                bernCtx.beginPath();
                bernCtx.moveTo(50, 100);
                bernCtx.bezierCurveTo(100, 70, 200, 70, 250, 100);
                bernCtx.lineTo(250, 110);
                bernCtx.lineTo(50, 110);
                bernCtx.closePath();
                bernCtx.fill();
                bernCtx.strokeStyle = '#2980b9';
                bernCtx.lineWidth = 2;
                bernCtx.stroke();
                
                // 공기 흐름 그리기
                const time = Date.now() * 0.001;
                
                // 위쪽 공기 흐름 (빠름)
                bernCtx.strokeStyle = '#2ecc71';
                for (let i = 0; i < 10; i++) {
                    const x = ((time * 50 + i * 30) % 300) - 10;
                    const yOffset = Math.sin(time + i) * 5;
                    
                    bernCtx.beginPath();
                    bernCtx.moveTo(x, 70 + yOffset);
                    bernCtx.lineTo(x + 15, 70 + yOffset);
                    bernCtx.stroke();
                }
                
                // 아래쪽 공기 흐름 (느림)
                bernCtx.strokeStyle = '#e74c3c';
                for (let i = 0; i < 7; i++) {
                    const x = ((time * 30 + i * 40) % 300) - 10;
                    
                    bernCtx.beginPath();
                    bernCtx.moveTo(x, 120);
                    bernCtx.lineTo(x + 15, 120);
                    bernCtx.stroke();
                }
                
                // 압력 표시
                bernCtx.fillStyle = '#2ecc71';
                bernCtx.font = '12px Arial';
                bernCtx.fillText('저압', 150, 60);
                
                bernCtx.fillStyle = '#e74c3c';
                bernCtx.fillText('고압', 150, 140);
                
                // 화살표 (양력)
                bernCtx.strokeStyle = '#9b59b6';
                bernCtx.lineWidth = 3;
                bernCtx.beginPath();
                bernCtx.moveTo(150, 110);
                bernCtx.lineTo(150, 80);
                bernCtx.lineTo(145, 85);
                bernCtx.moveTo(150, 80);
                bernCtx.lineTo(155, 85);
                bernCtx.stroke();
                
                bernCtx.fillStyle = '#9b59b6';
                bernCtx.fillText('양력', 160, 95);
                
                requestAnimationFrame(animateBernoulli);
            }
            
            animateBernoulli();
        }
        
        // 뉴턴의 운동 법칙 애니메이션
        const newtonElement = document.getElementById('newton-animation');
        if (newtonElement) {
            const newtonCanvas = document.createElement('canvas');
            newtonCanvas.width = newtonElement.clientWidth;
            newtonCanvas.height = newtonElement.clientHeight;
            newtonElement.appendChild(newtonCanvas);
            
            const newtonCtx = newtonCanvas.getContext('2d');
            
            // 뉴턴의 운동 법칙 애니메이션 함수
            function animateNewton() {
                newtonCtx.clearRect(0, 0, newtonCanvas.width, newtonCanvas.height);
                
                const time = Date.now() * 0.001;
                const x = 150 + Math.sin(time) * 50;
                
                // 제트 엔진 그리기
                newtonCtx.fillStyle = '#7f8c8d';
                newtonCtx.beginPath();
                newtonCtx.rect(x - 30, 80, 60, 20);
                newtonCtx.fill();
                
                // 제트 분사 그리기
                newtonCtx.fillStyle = '#e74c3c';
                newtonCtx.beginPath();
                newtonCtx.moveTo(x - 30, 80);
                newtonCtx.lineTo(x - 30, 100);
                newtonCtx.lineTo(x - 60 - Math.random() * 20, 90);
                newtonCtx.closePath();
                newtonCtx.fill();
                
                // 화살표 (추력)
                newtonCtx.strokeStyle = '#3498db';
                newtonCtx.lineWidth = 3;
                newtonCtx.beginPath();
                newtonCtx.moveTo(x, 70);
                newtonCtx.lineTo(x + 50, 70);
                newtonCtx.lineTo(x + 45, 65);
                newtonCtx.moveTo(x + 50, 70);
                newtonCtx.lineTo(x + 45, 75);
                newtonCtx.stroke();
                
                newtonCtx.fillStyle = '#3498db';
                newtonCtx.font = '12px Arial';
                newtonCtx.fillText('추력', x + 20, 60);
                
                // 화살표 (반작용)
                newtonCtx.strokeStyle = '#e74c3c';
                newtonCtx.beginPath();
                newtonCtx.moveTo(x - 30, 110);
                newtonCtx.lineTo(x - 80, 110);
                newtonCtx.lineTo(x - 75, 105);
                newtonCtx.moveTo(x - 80, 110);
                newtonCtx.lineTo(x - 75, 115);
                newtonCtx.stroke();
                
                newtonCtx.fillStyle = '#e74c3c';
                newtonCtx.fillText('반작용', x - 70, 130);
                
                requestAnimationFrame(animateNewton);
            }
            
            animateNewton();
        }
        
        // 항력과 양력 애니메이션
        const forcesElement = document.getElementById('forces-animation');
        if (forcesElement) {
            const forcesCanvas = document.createElement('canvas');
            forcesCanvas.width = forcesElement.clientWidth;
            forcesCanvas.height = forcesElement.clientHeight;
            forcesElement.appendChild(forcesCanvas);
            
            const forcesCtx = forcesCanvas.getContext('2d');
            
            // 힘 애니메이션 함수
            function animateForces() {
                forcesCtx.clearRect(0, 0, forcesCanvas.width, forcesCanvas.height);
                
                const time = Date.now() * 0.001;
                const y = 90 + Math.sin(time * 0.5) * 10;
                
                // 항공기 그리기
                forcesCtx.fillStyle = '#3498db';
                forcesCtx.beginPath();
                forcesCtx.ellipse(150, y, 40, 10, 0, 0, Math.PI * 2);
                forcesCtx.fill();
                
                // 날개 그리기
                forcesCtx.beginPath();
                forcesCtx.moveTo(130, y);
                forcesCtx.lineTo(110, y + 5);
                forcesCtx.lineTo(190, y + 5);
                forcesCtx.lineTo(170, y);
                forcesCtx.closePath();
                forcesCtx.fill();
                
                // 양력 화살표 (위쪽)
                forcesCtx.strokeStyle = '#2ecc71';
                forcesCtx.lineWidth = 3;
                forcesCtx.beginPath();
                forcesCtx.moveTo(150, y);
                forcesCtx.lineTo(150, y - 40);
                forcesCtx.lineTo(145, y - 35);
                forcesCtx.moveTo(150, y - 40);
                forcesCtx.lineTo(155, y - 35);
                forcesCtx.stroke();
                
                forcesCtx.fillStyle = '#2ecc71';
                forcesCtx.font = '12px Arial';
                forcesCtx.fillText('양력', 160, y - 30);
                
                // 중력 화살표 (아래쪽)
                forcesCtx.strokeStyle = '#e74c3c';
                forcesCtx.beginPath();
                forcesCtx.moveTo(150, y);
                forcesCtx.lineTo(150, y + 40);
                forcesCtx.lineTo(145, y + 35);
                forcesCtx.moveTo(150, y + 40);
                forcesCtx.lineTo(155, y + 35);
                forcesCtx.stroke();
                
                forcesCtx.fillStyle = '#e74c3c';
                forcesCtx.fillText('중력', 160, y + 40);
                
                // 추력 화살표 (앞쪽)
                forcesCtx.strokeStyle = '#3498db';
                forcesCtx.beginPath();
                forcesCtx.moveTo(150, y);
                forcesCtx.lineTo(200, y);
                forcesCtx.lineTo(195, y - 5);
                forcesCtx.moveTo(200, y);
                forcesCtx.lineTo(195, y + 5);
                forcesCtx.stroke();
                
                forcesCtx.fillStyle = '#3498db';
                forcesCtx.fillText('추력', 180, y - 10);
                
                // 항력 화살표 (뒤쪽)
                forcesCtx.strokeStyle = '#f39c12';
                forcesCtx.beginPath();
                forcesCtx.moveTo(150, y);
                forcesCtx.lineTo(100, y);
                forcesCtx.lineTo(105, y - 5);
                forcesCtx.moveTo(100, y);
                forcesCtx.lineTo(105, y + 5);
                forcesCtx.stroke();
                
                forcesCtx.fillStyle = '#f39c12';
                forcesCtx.fillText('항력', 100, y - 10);
                
                requestAnimationFrame(animateForces);
            }
            
            animateForces();
        }
    }
});

// 브라우저 창 크기 변경 시 이벤트 처리
window.addEventListener('resize', function() {
    const theoryImages = document.querySelectorAll('.theory-image canvas');
    theoryImages.forEach(canvas => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    });
});
