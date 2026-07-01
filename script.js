const calculators = {
  grade: {
    category: "Grade",
    title: "학점 계산기",
    badge: "전체/전공 평균",
    fields: [],
    hint: "과목명은 선택 입력입니다. 평점과 학점이 모두 입력된 과목만 평균에 반영됩니다.",
    calculate() {
      const subjects = Array.from(form.querySelectorAll(".subject-row"))
        .map((row) => ({
          name: row.querySelector('[name="subjectName"]')?.value.trim(),
          score: toNumber(row.querySelector('[name="subjectScore"]')?.value),
          credit: toNumber(row.querySelector('[name="subjectCredit"]')?.value),
          isMajor: row.querySelector('[name="isMajor"]')?.checked
        }))
        .filter((item) => item.score !== null && item.credit !== null && item.credit > 0);

      if (subjects.length === 0) {
        return emptyResult("한 과목 이상 평점과 학점을 입력하세요.");
      }

      const totalCredits = sum(subjects, "credit");
      const average = weightedAverage(subjects);
      const majorSubjects = subjects.filter((item) => item.isMajor);
      const majorCredits = sum(majorSubjects, "credit");
      const majorAverage = majorCredits > 0 ? weightedAverage(majorSubjects) : null;
      const subjectNames = subjects.map((item, index) => item.name || `과목 ${index + 1}`).join(", ");

      return {
        main: `전체 ${average.toFixed(2)} / 4.5`,
        sub: `총 ${formatNumber(totalCredits)}학점, ${subjects.length}개 과목 반영. 전공 평균: ${majorAverage === null ? "전공 과목 없음" : `${majorAverage.toFixed(2)} / 4.5 (${formatNumber(majorCredits)}학점)`}. 반영 과목: ${subjectNames}`
      };
    }
  },
  wage: {
    category: "Part-time",
    title: "알바 시급 계산기",
    badge: "실수령 예상",
    fields: [
      { id: "hourlyPay", label: "기본 시급", type: "number", placeholder: "예: 10030", min: "0" },
      { id: "hoursPerDay", label: "하루 근무 시간", type: "number", placeholder: "예: 6", step: "0.5", min: "0" },
      { id: "daysPerWeek", label: "주 근무일", type: "number", placeholder: "예: 5", step: "1", min: "0" },
      { id: "weeks", label: "근무 주 수", type: "number", placeholder: "예: 4.345", step: "0.001", min: "0" },
      { id: "overtimeHours", label: "주 연장근무 시간", type: "number", placeholder: "예: 2", step: "0.5", min: "0" },
      { id: "nightHours", label: "주 야간근무 시간", type: "number", placeholder: "예: 4", step: "0.5", min: "0" },
      {
        id: "weeklyAllowance",
        label: "주휴수당",
        type: "select",
        options: [
          { value: "auto", label: "자동 계산" },
          { value: "none", label: "제외" }
        ]
      },
      { id: "taxRate", label: "공제율(%)", type: "number", placeholder: "예: 3.3", step: "0.1", min: "0" }
    ],
    hint: "연장/야간 수당은 50% 가산으로 계산합니다. 실제 급여는 계약 조건과 공제 항목에 따라 달라질 수 있습니다.",
    calculate(values) {
      const hourlyPay = toNumber(values.hourlyPay);
      const hoursPerDay = toNumber(values.hoursPerDay);
      const daysPerWeek = toNumber(values.daysPerWeek);
      const weeks = toNumber(values.weeks);
      const overtimeHours = toNumber(values.overtimeHours) || 0;
      const nightHours = toNumber(values.nightHours) || 0;
      const taxRate = toNumber(values.taxRate) || 0;

      if ([hourlyPay, hoursPerDay, daysPerWeek, weeks].some((value) => value === null)) {
        return emptyResult("기본 시급, 하루 근무 시간, 주 근무일, 근무 주 수를 입력하세요.");
      }

      const baseHoursPerWeek = hoursPerDay * daysPerWeek;
      const basePay = hourlyPay * baseHoursPerWeek * weeks;
      const overtimePay = hourlyPay * 0.5 * overtimeHours * weeks;
      const nightPay = hourlyPay * 0.5 * nightHours * weeks;
      const allowance = values.weeklyAllowance === "auto" && baseHoursPerWeek >= 15
        ? hourlyPay * Math.min(8, baseHoursPerWeek / 5) * weeks
        : 0;
      const grossPay = basePay + overtimePay + nightPay + allowance;
      const deduction = grossPay * taxRate / 100;
      const netPay = grossPay - deduction;

      return {
        main: `${formatWon(netPay)}`,
        sub: `세전 ${formatWon(grossPay)} - 공제 ${formatWon(deduction)}. 기본 ${formatNumber(baseHoursPerWeek * weeks)}시간, 연장 ${formatNumber(overtimeHours * weeks)}시간, 야간 ${formatNumber(nightHours * weeks)}시간, 주휴수당 ${formatWon(allowance)} 기준입니다.`
      };
    }
  },
  rent: {
    category: "Housing",
    title: "월세/관리비 계산기",
    badge: "월 주거비",
    fields: [
      { id: "deposit", label: "보증금", type: "number", placeholder: "예: 10000000", min: "0" },
      { id: "depositRate", label: "보증금 환산 이율(연 %)", type: "number", placeholder: "예: 4", step: "0.1", min: "0" },
      { id: "rent", label: "월세", type: "number", placeholder: "예: 500000", min: "0" },
      { id: "maintenance", label: "관리비", type: "number", placeholder: "예: 80000", min: "0" },
      { id: "utilities", label: "공과금/인터넷", type: "number", placeholder: "예: 70000", min: "0" },
      { id: "parking", label: "주차/기타 비용", type: "number", placeholder: "예: 30000", min: "0" },
      { id: "months", label: "계산 개월 수", type: "number", placeholder: "예: 12", min: "1" },
      { id: "people", label: "분담 인원", type: "number", placeholder: "예: 1", min: "1" }
    ],
    hint: "보증금 환산 이율을 넣으면 보증금의 월 기회비용까지 포함한 체감 주거비를 계산합니다.",
    calculate(values) {
      const deposit = toNumber(values.deposit) || 0;
      const depositRate = toNumber(values.depositRate) || 0;
      const rent = toNumber(values.rent) || 0;
      const maintenance = toNumber(values.maintenance) || 0;
      const utilities = toNumber(values.utilities) || 0;
      const parking = toNumber(values.parking) || 0;
      const months = toNumber(values.months);
      const people = toNumber(values.people) || 1;

      if (months === null || months <= 0) {
        return emptyResult("계산할 개월 수를 입력하세요.");
      }

      const depositMonthlyCost = deposit * depositRate / 100 / 12;
      const monthly = rent + maintenance + utilities + parking;
      const effectiveMonthly = monthly + depositMonthlyCost;
      const perPerson = effectiveMonthly / people;

      return {
        main: `${formatWon(effectiveMonthly)} / 월`,
        sub: `월 고정비 ${formatWon(monthly)} + 보증금 환산 ${formatWon(depositMonthlyCost)}. ${formatNumber(months)}개월 총액은 ${formatWon(effectiveMonthly * months)}, 1인 부담은 ${formatWon(perPerson)}입니다.`
      };
    }
  },
  loan: {
    category: "Loan",
    title: "대출 이자 계산기",
    badge: "상환 계획",
    fields: [
      { id: "principal", label: "대출 원금", type: "number", placeholder: "예: 10000000", min: "0" },
      { id: "annualRate", label: "연 이자율(%)", type: "number", placeholder: "예: 5.2", step: "0.1", min: "0" },
      { id: "loanMonths", label: "상환 기간(개월)", type: "number", placeholder: "예: 36", min: "1" },
      {
        id: "loanType",
        label: "상환 방식",
        type: "select",
        options: [
          { value: "amortized", label: "원리금 균등" },
          { value: "principalEqual", label: "원금 균등" },
          { value: "interestOnly", label: "월 이자만" }
        ]
      },
      { id: "extraPayment", label: "매월 추가 상환액", type: "number", placeholder: "예: 100000", min: "0" },
      { id: "feeRate", label: "취급/기타 수수료율(%)", type: "number", placeholder: "예: 0.5", step: "0.1", min: "0" }
    ],
    hint: "원금 균등은 첫 달 상환액과 마지막 달 상환액을 함께 표시합니다. 실제 금융상품의 세부 조건은 별도 확인이 필요합니다.",
    calculate(values) {
      const principal = toNumber(values.principal);
      const annualRate = toNumber(values.annualRate);
      const months = toNumber(values.loanMonths);
      const extraPayment = toNumber(values.extraPayment) || 0;
      const feeRate = toNumber(values.feeRate) || 0;

      if ([principal, annualRate, months].some((value) => value === null) || months <= 0) {
        return emptyResult("대출 원금, 이자율, 상환 기간을 입력하세요.");
      }

      const monthlyRate = annualRate / 100 / 12;
      const fee = principal * feeRate / 100;

      if (values.loanType === "interestOnly") {
        const monthlyInterest = principal * monthlyRate;
        return {
          main: `${formatWon(monthlyInterest)} / 월`,
          sub: `전체 기간 이자는 약 ${formatWon(monthlyInterest * months)}, 수수료는 ${formatWon(fee)}입니다. 원금 ${formatWon(principal)}은 별도 상환해야 합니다.`
        };
      }

      if (values.loanType === "principalEqual") {
        const monthlyPrincipal = principal / months;
        const firstPayment = monthlyPrincipal + principal * monthlyRate + extraPayment;
        const lastPayment = monthlyPrincipal + monthlyPrincipal * monthlyRate + extraPayment;
        const totalInterest = principal * monthlyRate * (months + 1) / 2;

        return {
          main: `첫 달 ${formatWon(firstPayment)}`,
          sub: `마지막 달은 약 ${formatWon(lastPayment)}입니다. 총 이자 ${formatWon(totalInterest)}, 수수료 ${formatWon(fee)}, 매월 추가 상환 ${formatWon(extraPayment)} 기준입니다.`
        };
      }

      const payment = monthlyRate === 0
        ? principal / months
        : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
      const monthlyPayment = payment + extraPayment;
      const totalPayment = payment * months + extraPayment * months;

      return {
        main: `${formatWon(monthlyPayment)} / 월`,
        sub: `기본 월 상환액 ${formatWon(payment)}, 총 상환액 약 ${formatWon(totalPayment + fee)}, 총 이자 약 ${formatWon(payment * months - principal)}, 수수료 ${formatWon(fee)}입니다.`
      };
    }
  },
  bmi: {
    category: "Health",
    title: "BMI 계산기",
    badge: "건강 지표",
    fields: [
      { id: "height", label: "키(cm)", type: "number", placeholder: "예: 170", step: "0.1", min: "0" },
      { id: "weight", label: "몸무게(kg)", type: "number", placeholder: "예: 65", step: "0.1", min: "0" },
      { id: "age", label: "나이", type: "number", placeholder: "예: 25", min: "0" },
      {
        id: "activity",
        label: "활동량",
        type: "select",
        options: [
          { value: "1.2", label: "낮음" },
          { value: "1.375", label: "가벼운 활동" },
          { value: "1.55", label: "보통" },
          { value: "1.725", label: "높음" }
        ]
      }
    ],
    hint: "BMI와 정상 체중 범위, 간단한 유지 칼로리 추정치를 함께 보여줍니다. 의료 진단 용도는 아닙니다.",
    calculate(values) {
      const height = toNumber(values.height);
      const weight = toNumber(values.weight);
      const age = toNumber(values.age);
      const activity = toNumber(values.activity) || 1.2;

      if (!height || !weight) {
        return emptyResult("키와 몸무게를 입력하세요.");
      }

      const heightMeters = height / 100;
      const bmi = weight / heightMeters ** 2;
      const category = getBmiCategory(bmi);
      const minNormalWeight = 18.5 * heightMeters ** 2;
      const maxNormalWeight = 22.9 * heightMeters ** 2;
      const calorieEstimate = age
        ? Math.round((10 * weight + 6.25 * height - 5 * age) * activity)
        : null;

      return {
        main: `${bmi.toFixed(1)} (${category})`,
        sub: `정상 BMI 기준 체중 범위는 약 ${formatNumber(minNormalWeight)}kg ~ ${formatNumber(maxNormalWeight)}kg입니다.${calorieEstimate ? ` 활동량 기준 유지 칼로리 추정치는 약 ${formatNumber(calorieEstimate)}kcal입니다.` : " 나이를 입력하면 유지 칼로리도 추정합니다."}`
      };
    }
  },
  military: {
    category: "Service",
    title: "군대 전역일 계산기",
    badge: "복무 진행률",
    fields: [
      { id: "startDate", label: "입대일", type: "date" },
      {
        id: "servicePreset",
        label: "복무 구분",
        type: "select",
        options: [
          { value: "18", label: "육군/해병대 18개월" },
          { value: "20", label: "해군 20개월" },
          { value: "21", label: "공군 21개월" },
          { value: "custom", label: "직접 입력" }
        ]
      },
      { id: "serviceMonths", label: "직접 입력 복무 개월", type: "number", placeholder: "직접 입력 선택 시", min: "1" },
      { id: "leaveDays", label: "미사용 휴가/조정일", type: "number", placeholder: "예: 0", min: "0" }
    ],
    hint: "복무 구분을 고르면 기간이 자동 적용됩니다. 개인별 복무 조정, 휴가 사용 계획은 단순 보정값으로만 반영합니다.",
    calculate(values) {
      if (!values.startDate) {
        return emptyResult("입대일을 입력하세요.");
      }

      const presetMonths = values.servicePreset === "custom" ? null : toNumber(values.servicePreset);
      const serviceMonths = presetMonths || toNumber(values.serviceMonths);
      const leaveDays = toNumber(values.leaveDays) || 0;

      if (!serviceMonths) {
        return emptyResult("복무 기간을 선택하거나 직접 입력하세요.");
      }

      const startDate = new Date(`${values.startDate}T00:00:00`);
      const dischargeDate = addMonths(startDate, serviceMonths);
      dischargeDate.setDate(dischargeDate.getDate() - 1 - leaveDays);

      const today = startOfToday();
      const totalDays = Math.max(1, diffDays(startDate, dischargeDate) + 1);
      const elapsedDays = clamp(diffDays(startDate, today), 0, totalDays);
      const remainingDays = diffDays(today, dischargeDate);
      const progress = elapsedDays / totalDays * 100;

      return {
        main: remainingDays >= 0 ? `D-${remainingDays}` : `전역 후 ${Math.abs(remainingDays)}일`,
        sub: `예상 전역일은 ${formatDate(dischargeDate)}입니다. 복무 진행률은 약 ${progress.toFixed(1)}%, 경과 ${formatNumber(elapsedDays)}일 / 전체 ${formatNumber(totalDays)}일입니다.`
      };
    }
  },
  dday: {
    category: "Date",
    title: "날짜 D-day 계산기",
    badge: "날짜 차이",
    fields: [
      { id: "eventName", label: "일정 이름", type: "text", placeholder: "예: 시험, 여행, 기념일" },
      { id: "baseDate", label: "기준 날짜", type: "date" },
      { id: "targetDate", label: "목표 날짜", type: "date" },
      {
        id: "includeToday",
        label: "계산 방식",
        type: "select",
        options: [
          { value: "exclude", label: "오늘 제외" },
          { value: "include", label: "오늘 포함" }
        ]
      }
    ],
    hint: "기준 날짜를 비우면 오늘을 기준으로 계산합니다. 날짜 차이와 주 단위 환산을 함께 표시합니다.",
    calculate(values) {
      if (!values.targetDate) {
        return emptyResult("목표 날짜를 선택하세요.");
      }

      const baseDate = values.baseDate ? new Date(`${values.baseDate}T00:00:00`) : startOfToday();
      const targetDate = new Date(`${values.targetDate}T00:00:00`);
      const rawDifference = diffDays(baseDate, targetDate);
      const adjustment = values.includeToday === "include" && rawDifference >= 0 ? 1 : 0;
      const difference = rawDifference + adjustment;
      const eventName = values.eventName || "목표일";
      const weeks = Math.floor(Math.abs(difference) / 7);
      const days = Math.abs(difference) % 7;

      if (difference === 0) {
        return { main: "D-day", sub: `${eventName}: ${formatDate(targetDate)}. 기준일 ${formatDate(baseDate)}와 같은 날입니다.` };
      }

      return {
        main: difference > 0 ? `D-${difference}` : `D+${Math.abs(difference)}`,
        sub: `${eventName}: ${formatDate(targetDate)}. 기준일 ${formatDate(baseDate)}에서 ${weeks}주 ${days}일 차이입니다.`
      };
    }
  }
};

const navButtons = document.querySelectorAll(".nav-button");
const form = document.querySelector("#calculator-form");
const panelCategory = document.querySelector("#panel-category");
const panelTitle = document.querySelector("#panel-title");
const panelBadge = document.querySelector("#panel-badge");
const resultMain = document.querySelector("#result-main");
const resultSub = document.querySelector("#result-sub");

let activeCalculator = "grade";
let subjectRowCount = 3;

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCalculator = button.dataset.calculator;
    navButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderCalculator();
  });
});

function renderCalculator() {
  const calculator = calculators[activeCalculator];
  panelCategory.textContent = calculator.category;
  panelTitle.textContent = calculator.title;
  panelBadge.textContent = calculator.badge;

  if (activeCalculator === "grade") {
    renderGradeCalculator();
    return;
  }

  form.innerHTML = calculator.fields.map(renderField).join("") + `
    <div class="full-row">
      <p class="hint">${calculator.hint}</p>
    </div>
    <div class="actions">
      <button class="primary-button" type="submit">계산하기</button>
      <button class="secondary-button" type="reset">초기화</button>
    </div>
  `;

  resetResult();
}

function renderGradeCalculator() {
  subjectRowCount = Math.max(subjectRowCount, 1);

  form.innerHTML = `
    <div class="subject-list full-row" id="subject-list">
      ${Array.from({ length: subjectRowCount }, (_, index) => renderSubjectRow(index + 1)).join("")}
    </div>
    <div class="full-row">
      <p class="hint">${calculators.grade.hint}</p>
    </div>
    <div class="actions">
      <button class="secondary-button" type="button" data-action="add-subject">과목 추가</button>
      <button class="primary-button" type="submit">계산하기</button>
      <button class="secondary-button" type="reset">초기화</button>
    </div>
  `;

  resetResult();
}

function renderSubjectRow(index) {
  return `
    <div class="subject-row" data-subject-row>
      <div class="field subject-name-field">
        <label>과목명</label>
        <input name="subjectName" type="text" placeholder="예: 자료구조">
      </div>
      <div class="field">
        <label>평점</label>
        <input name="subjectScore" type="number" placeholder="예: 4.5" step="0.1" min="0" max="4.5">
      </div>
      <div class="field">
        <label>학점</label>
        <input name="subjectCredit" type="number" placeholder="예: 3" step="0.5" min="0">
      </div>
      <label class="major-toggle">
        <input name="isMajor" type="checkbox">
        <span>전공</span>
      </label>
      <button class="icon-button" type="button" data-action="remove-subject" aria-label="과목 ${index} 삭제">삭제</button>
    </div>
  `;
}

function renderField(field) {
  if (field.type === "select") {
    const options = field.options
      .map((option) => `<option value="${option.value}">${option.label}</option>`)
      .join("");
    return `
      <div class="field">
        <label for="${field.id}">${field.label}</label>
        <select id="${field.id}" name="${field.id}">${options}</select>
      </div>
    `;
  }

  const attributes = [
    `id="${field.id}"`,
    `name="${field.id}"`,
    `type="${field.type}"`,
    field.placeholder ? `placeholder="${field.placeholder}"` : "",
    field.step ? `step="${field.step}"` : "",
    field.min ? `min="${field.min}"` : ""
  ].filter(Boolean).join(" ");

  return `
    <div class="field">
      <label for="${field.id}">${field.label}</label>
      <input ${attributes}>
    </div>
  `;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  const result = calculators[activeCalculator].calculate(values);
  resultMain.textContent = result.main;
  resultSub.textContent = result.sub;
});

form.addEventListener("click", (event) => {
  const action = event.target.dataset.action;

  if (action === "add-subject") {
    subjectRowCount += 1;
    document.querySelector("#subject-list").insertAdjacentHTML("beforeend", renderSubjectRow(subjectRowCount));
    return;
  }

  if (action === "remove-subject") {
    const rows = form.querySelectorAll(".subject-row");

    if (rows.length <= 1) {
      resultMain.textContent = "입력값을 확인하세요.";
      resultSub.textContent = "과목은 최소 1개 이상 필요합니다.";
      return;
    }

    event.target.closest(".subject-row").remove();
  }
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    if (activeCalculator === "grade") {
      subjectRowCount = 3;
      renderGradeCalculator();
      return;
    }

    resetResult();
  }, 0);
});

function resetResult() {
  resultMain.textContent = "값을 입력하면 결과가 표시됩니다.";
  resultSub.textContent = "필수 항목을 채운 뒤 계산 버튼을 누르세요.";
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyResult(message) {
  return {
    main: "입력값을 확인하세요.",
    sub: message
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value);
}

function formatWon(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "저체중";
  if (bmi < 23) return "정상";
  if (bmi < 25) return "과체중";
  return "비만";
}

function sum(items, key) {
  return items.reduce((total, item) => total + item[key], 0);
}

function weightedAverage(items) {
  return items.reduce((total, item) => total + item.score * item.credit, 0) / sum(items, "credit");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function addMonths(date, months) {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + Number(months));

  if (result.getDate() !== day) {
    result.setDate(0);
  }

  return result;
}

function diffDays(fromDate, toDate) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((toDate - fromDate) / millisecondsPerDay);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

renderCalculator();
