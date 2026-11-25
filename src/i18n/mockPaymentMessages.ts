export const mockPaymentMessages: Record<string, { ru: string; kk: string }> = {
  "Payment provider": { ru: "Платёжный провайдер", kk: "Төлем провайдері" },
  "Provider for new payments": {
    ru: "Провайдер для новых платежей",
    kk: "Жаңа төлемдер провайдері",
  },
  "Applies to new ticket payments and activation fees. Existing payments and refunds stay with their original provider.":
    {
      ru: "Применяется к новым оплатам билетов и сборам за активацию. Уже созданные платежи и их возвраты обрабатывает исходный провайдер.",
      kk: "Жаңа билет төлемдеріне және белсендіру алымдарына қолданылады. Бұрынғы төлемдер мен олардың қайтарымдарын бастапқы провайдер өңдейді.",
    },
  "Halyk ePay sandbox": {
    ru: "Тестовая среда Halyk ePay",
    kk: "Halyk ePay сынақ ортасы",
  },
  "BiletFlow mock checkout": {
    ru: "Симулятор оплаты BiletFlow",
    kk: "BiletFlow төлем симуляторы",
  },
  "Save provider": { ru: "Сохранить провайдера", kk: "Провайдерді сақтау" },
  "Payment provider saved.": {
    ru: "Платёжный провайдер сохранён.",
    kk: "Төлем провайдері сақталды.",
  },
  "Could not save the payment provider.": {
    ru: "Не удалось сохранить платёжного провайдера.",
    kk: "Төлем провайдерін сақтау мүмкін болмады.",
  },
  "Continue to payment": { ru: "Перейти к оплате", kk: "Төлемге өту" },
  "Opening payment…": { ru: "Открываем оплату…", kk: "Төлем ашылуда…" },
  "Complete payment to receive your tickets.": {
    ru: "Завершите оплату, чтобы получить билеты.",
    kk: "Билеттеріңізді алу үшін төлемді аяқтаңыз.",
  },
  "Could not open the payment. Try again.": {
    ru: "Не удалось открыть оплату. Попробуйте ещё раз.",
    kk: "Төлемді ашу мүмкін болмады. Қайталап көріңіз.",
  },
  "Back to event management": {
    ru: "К управлению мероприятием",
    kk: "Іс-шараны басқаруға оралу",
  },
  "Mock checkout": { ru: "Симуляция оплаты", kk: "Төлемді симуляциялау" },
  "Ticket payment": { ru: "Оплата билетов", kk: "Билет төлемі" },
  "Simulate a payment. No money moves and no card details are needed.": {
    ru: "Это симуляция оплаты. Деньги не списываются, данные карты не нужны.",
    kk: "Бұл төлем симуляциясы. Ақша алынбайды, карта деректері қажет емес.",
  },
  "Payment expires at {0}.": {
    ru: "Срок оплаты истекает {0}.",
    kk: "Төлем мерзімі {0} аяқталады.",
  },
  "Payment closed": { ru: "Платёж закрыт", kk: "Төлем жабылды" },
  "Loading payment…": { ru: "Загружаем платёж…", kk: "Төлем жүктелуде…" },
  "Could not load this mock payment.": {
    ru: "Не удалось загрузить тестовый платёж.",
    kk: "Сынақ төлемін жүктеу мүмкін болмады.",
  },
  "Succeed now": { ru: "Подтвердить сейчас", kk: "Қазір растау" },
  "Succeed after {0} seconds": {
    ru: "Подтвердить через {0} сек.",
    kk: "{0} секундтан кейін растау",
  },
  "Simulate failure": {
    ru: "Имитировать отказ",
    kk: "Төлемнен бас тартуды симуляциялау",
  },
  "Expire payment": {
    ru: "Завершить срок оплаты",
    kk: "Төлем мерзімін аяқтау",
  },
  "The simulator will confirm this payment automatically.": {
    ru: "Симулятор подтвердит этот платёж автоматически.",
    kk: "Симулятор бұл төлемді автоматты түрде растайды.",
  },
  "This payment expires too soon to simulate a delay.": {
    ru: "До истечения срока оплаты слишком мало времени, чтобы имитировать задержку.",
    kk: "Кідірісті симуляциялау үшін төлем мерзімі аяқталғанға дейін уақыт аз.",
  },
  "Saving the simulated outcome…": {
    ru: "Сохраняем результат симуляции…",
    kk: "Симуляция нәтижесі сақталуда…",
  },
  "Could not simulate the payment. Try again.": {
    ru: "Не удалось симулировать платёж. Попробуйте ещё раз.",
    kk: "Төлемді симуляциялау мүмкін болмады. Қайталап көріңіз.",
  },
}
