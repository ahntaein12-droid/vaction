const calculators = {
  grade: {
    category: "Grade",
    title: "학점 계산기",
    badge: "평균 평점",
    fields: [
      { id: "score1", label: "과목 1 평점", type: "number", placeholder: "예: 4.5", step: "0.1", min: "0" },
      { id: "credit1", label: "과목 1 학점", type: "number", placeholder: "예: 3", step: "0.5", min: "0" },
      { id: "score2", label: "과목 2 평점", type: "number", placeholder: "예: 4.0", step: "0.1", min: "0" },
      { id: "credit2", label: "과목 2 학점", type: "number", placeholder: "예: 3", step: "0.5", min: "0" },
      { id: "score3", label: "과목 3 평점", type: "number", placeholder: "선택 입력", step: "0.1", min: "0" },
      { id: "credit3", label: "과목 3 학점", type: "number", placeholder: "선택 입력", step: "0.5", min: "0" }
    ],
    hint: "평점과 학점이 모두 입력된 과목만 평균에 반영됩니다.",
    calculate(values) {
      const subjects = [1, 2, 3]
        .map((index) => ({
          score: toNumber(values[`score${index}`]),
          credit: toNumber(values[`credit${index}`])
        }))
        .filter((item) => item.score !== null && item.credit !== null && item.credit > 0);

      if (subjects.length === 0) {
        return emptyResult("한 과목 이상 평점과 학점을 입력하세요.");
      }

      const totalCredits = subjects.reduce((sum, item) => sum + item.credit, 0);
      const weighted = subjects.reduce((sum, item) => sum + item.score * item.credit, 0);
      const average = weighted / totalCredits;

      return {
        main: `${average.toFixed(2)} / 4.5`,
        sub: `총 ${formatNumber(totalCredits)}학점 기준, ${subjects.length}개 과목을 반영했습니다.`
      };
    }
  },
  wage: {
    category: "Part-time",
    title: "알바 시급 계산기",
    badge: "예상 급여",
    fields: [
      { id: "hourlyPay", label: "시급", type: "number", placeholder: "예: 10030", min: "0" },
      { id: "hoursPerDay", label: "하루 근무 시간", type: "number", placeholder: "예: 6", step: "0.5", min: "0" },
      { id: "daysPerWeek", label: "주 근무일", type: "number", placeholder: "예: 5", step: "1", min: "0" },
      { id: "weeks", label: "근무 주 수", type: "number", placeholder: "예: 4", step: "0.5", min: "0" }
    ],
    hint: "세금, 주휴수당, 야간수당은 제외한 단순 예상 금액입니다.",
    calculate(values) {
      const hourlyPay = toNumber(values.hourlyPay);
      const hoursPerDay = toNumber(values.hoursPerDay);
      const daysPerWeek = toNumber(values.daysPerWeek);
      const weeks = toNumber(values.weeks);

      if ([hourlyPay, hoursPerDay, daysPerWeek, weeks].some((value) => value === null)) {
        return emptyResult("시급, 근무 시간, 근무일, 근무 주 수를 입력하세요.");
      }

      const totalHours = hoursPerDay * daysPerWeek * weeks;
      const totalPay = hourlyPay * totalHours;

      return {
        main: `${formatWon(totalPay)}`,
        sub: `총 ${formatNumber(totalHours)}시간 근무 기준입니다.`
      };
    }
  },
  rent: {
    category: "Housing",
    title: "월세/관리비 계산기",
    badge: "월 고정비",
    fields: [
      { id: "rent", label: "월세", type: "number", placeholder: "예: 500000", min: "0" },
      { id: "maintenance", label: "관리비", type: "number", placeholder: "예: 80000", min: "0" },
      { id: "utilities", label: "공과금/인터넷", type: "number", placeholder: "예: 70000", min: "0" },
      { id: "months", label: "계산 개월 수", type: "number", placeholder: "예: 12", min: "1" }
    ],
    hint: "보증금은 포함하지 않고 매월 나가는 비용만 계산합니다.",
    calculate(values) {
      const rent = toNumber(values.rent) || 0;
      const maintenance = toNumber(values.maintenance) || 0;
      const utilities = toNumber(values.utilities) || 0;
      const months = toNumber(values.months);

      if (months === null || months <= 0) {
        return emptyResult("계산할 개월 수를 입력하세요.");
      }

      const monthly = rent + maintenance + utilities;

      return {
        main: `${formatWon(monthly)} / 월`,
        sub: `${formatNumber(months)}개월 합계는 ${formatWon(monthly * months)}입니다.`
      };
    }
  },
  loan: {
    category: "Loan",
    title: "대출 이자 계산기",
    badge: "월 상환액",
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
          { value: "interestOnly", label: "월 이자만" }
        ]
      }
    ],
    hint: "실제 금융상품의 수수료, 중도상환 조건, 일할 계산은 반영하지 않습니다.",
    calculate(values) {
      const principal = toNumber(values.principal);
      const annualRate = toNumber(values.annualRate);
      const months = toNumber(values.loanMonths);

      if ([principal, annualRate, months].some((value) => value === null) || months <= 0) {
        return emptyResult("대출 원금, 이자율, 상환 기간을 입력하세요.");
      }

      const monthlyRate = annualRate / 100 / 12;

      if (values.loanType === "interestOnly" || monthlyRate === 0) {
        const monthlyInterest = principal * monthlyRate;
        return {
          main: values.loanType === "interestOnly" ? `${formatWon(monthlyInterest)} / 월` : `${formatWon(principal / months)} / 월`,
          sub: values.loanType === "interestOnly"
            ? `전체 기간 이자는 약 ${formatWon(monthlyInterest * months)}입니다.`
            : `무이자 기준으로 원금을 ${formatNumber(months)}개월에 나눈 금액입니다.`
        };
      }

      const payment = principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
      const totalPayment = payment * months;

      return {
        main: `${formatWon(payment)} / 월`,
        sub: `총 상환액은 약 ${formatWon(totalPayment)}, 총 이자는 약 ${formatWon(totalPayment - principal)}입니다.`
      };
    }
  },
  bmi: {
    category: "Health",
    title: "BMI 계산기",
    badge: "체질량지수",
    fields: [
      { id: "height", label: "키(cm)", type: "number", placeholder: "예: 170", step: "0.1", min: "0" },
      { id: "weight", label: "몸무게(kg)", type: "number", placeholder: "예: 65", step: "0.1", min: "0" }
    ],
    hint: "BMI는 참고 지표이며, 정확한 건강 평가는 전문가 상담이 필요합니다.",
    calculate(values) {
      const height = toNumber(values.height);
      const weight = toNumber(values.weight);

      if (!height || !weight) {
        return emptyResult("키와 몸무게를 입력하세요.");
      }

      const bmi = weight / (height / 100) ** 2;
      const category = getBmiCategory(bmi);

      return {
        main: `${bmi.toFixed(1)} (${category})`,
        sub: `입력값: ${formatNumber(height)}cm, ${formatNumber(weight)}kg`
      };
    }
  },
  military: {
    category: "Service",
    title: "군대 전역일 계산기",
    badge: "남은 복무일",
    fields: [
      { id: "startDate", label: "입대일", type: "date" },
      { id: "serviceMonths", label: "복무 기간(개월)", type: "number", placeholder: "예: 18", min: "1" }
    ],
    hint: "개인별 복무 조정, 휴가, 조기 전역 등은 반영하지 않는 단순 날짜 계산입니다.",
    calculate(values) {
      if (!values.startDate || !values.serviceMonths) {
        return emptyResult("입대일과 복무 기간을 입력하세요.");
      }

      const startDate = new Date(`${values.startDate}T00:00:00`);
      const dischargeDate = addMonths(startDate, Number(values.serviceMonths));
      dischargeDate.setDate(dischargeDate.getDate() - 1);

      const today = startOfToday();
      const remainingDays = diffDays(today, dischargeDate);

      return {
        main: remainingDays >= 0 ? `D-${remainingDays}` : `전역 후 ${Math.abs(remainingDays)}일`,
        sub: `예상 전역일은 ${formatDate(dischargeDate)}입니다.`
      };
    }
  },
  dday: {
    category: "Date",
    title: "날짜 D-day 계산기",
    badge: "D-day",
    fields: [
      { id: "targetDate", label: "목표 날짜", type: "date" },
      { id: "eventName", label: "일정 이름", type: "text", placeholder: "예: 시험, 여행, 기념일" }
    ],
    hint: "오늘 날짜를 기준으로 목표일까지 남은 날짜를 계산합니다.",
    calculate(values) {
      if (!values.targetDate) {
        return emptyResult("목표 날짜를 선택하세요.");
      }

      const targetDate = new Date(`${values.targetDate}T00:00:00`);
      const today = startOfToday();
      const difference = diffDays(today, targetDate);
      const eventName = values.eventName || "목표일";

      if (difference === 0) {
        return { main: "D-day", sub: `오늘은 ${eventName}입니다.` };
      }

      return {
        main: difference > 0 ? `D-${difference}` : `D+${Math.abs(difference)}`,
        sub: `${eventName}: ${formatDate(targetDate)}`
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

  form.innerHTML = calculator.fields.map(renderField).join("") + `
    <div class="full-row">
      <p class="hint">${calculator.hint}</p>
    </div>
    <div class="actions">
      <button class="primary-button" type="submit">계산하기</button>
      <button class="secondary-button" type="reset">초기화</button>
    </div>
  `;

  resultMain.textContent = "값을 입력하면 결과가 표시됩니다.";
  resultSub.textContent = "필수 항목을 채운 뒤 계산 버튼을 누르세요.";
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

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    resultMain.textContent = "값을 입력하면 결과가 표시됩니다.";
    resultSub.textContent = "필수 항목을 채운 뒤 계산 버튼을 누르세요.";
  }, 0);
});

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
