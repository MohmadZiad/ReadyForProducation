export const translations = {
  en: {
    // Header
    logo: "Orange Tool",
    openAssistant: "Open Assistant",
    launchCalculator: "Launch Calculator",
    
    // Hero
    heroTitle: "Intelligent Tools for",
    heroTitleHighlight: "Modern Business",
    heroSubtitle: "Powerful calculations, smart analytics, and instant results at your fingertips",
    
    // KPIs
    kpi1Title: "Response Time",
    kpi1Value: "<50ms",
    kpi1Label: "Lightning Fast",
    kpi2Title: "Uptime",
    kpi2Value: "99.9%",
    kpi2Label: "Always Available",
    kpi3Title: "Monitoring",
    kpi3Value: "24/7",
    kpi3Label: "Round the Clock",
    kpi4Title: "Accuracy",
    kpi4Value: "100%",
    kpi4Label: "Precise Results",
    
    // Features
    feature1Title: "Instant Results",
    feature1Description: "Get immediate calculations and analytics with our powerful processing engine",
    feature2Title: "Smart Pro-Rata",
    feature2Description: "Intelligent pro-rata calculations with automated precision and clarity",
    feature3Title: "Live Library",
    feature3Description: "Access comprehensive documentation and resources instantly",
    
    // Navigation
    home: "Home",
    calculator: "Calculator",
    proRata: "Pro-Rata",
    assistant: "Assistant",
    docs: "Documentation",
    
    // Calculator
    calcTitle: "Advanced Calculator",
    calcSubtitle: "Perform complex calculations with ease",
    calcInput1: "First Value",
    calcInput2: "Second Value",
    calcInput3: "Third Value",
    calcType: "Calculation Type",
    calcSimple: "Simple",
    calcPercentage: "Percentage",
    calcCompound: "Compound",
    calculate: "Calculate",
    result: "Result",
    formula: "Formula",
    
    // Pro-Rata
    proRataTitle: "Pro-Rata Calculator",
    proRataSubtitle: "Calculate proportional amounts accurately",
    totalAmount: "Total Amount",
    totalDays: "Total Days",
    daysUsed: "Days Used",
    description: "Description",
    proRataAmount: "Pro-Rata Amount",
    calculateProRata: "Calculate Pro-Rata",
    
    // Assistant
    assistantTitle: "AI Assistant",
    assistantSubtitle: "Get help with your calculations and queries",
    typeMessage: "Type your message...",
    send: "Send",
    thinking: "Thinking...",
    
    // Docs
    docsTitle: "Documentation",
    docsSubtitle: "Find answers and learn more",
    searchDocs: "Search documentation...",
    noResults: "No results found",
    
    // Summary
    summaryTitle: "Recent Activity",
    summaryEmpty: "No recent activity",
    
    // Common
    loading: "Loading...",
    error: "An error occurred",
    tryAgain: "Try Again",
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    light: "Light",
    dark: "Dark",
    theme: "Theme",
    language: "Language",
    proRataProductLabel: "Product",
    proRataActivationLabel: "Activation date",
    proRataBasePriceLabel: "Base monthly price",
    proRataAddOnsLabel: "Add-ons",
    proRataAddOnsPlaceholder: "Select add-ons",
    proRataBillAnchorLabel: "Anchor day",
    proRataBillCycleInfo: "1st & End of month Bill Cycle (reference)",
    proRataHeroDescription: "Choose the product, activation date, and add-ons to build the first invoice breakdown.",
    proRataBillCycleStart: "Bill cycle start",
    proRataBillCycleEnd: "Bill cycle end",
    proRataBillCycleNext: "Next cycle end",
    proRataCycleDays: "Cycle days",
    proRataProDays: "Prorated days",
    proRataRatio: "Ratio",
    proRataBase: "Base price",
    proRataAddOnsTotal: "Add-ons total",
    proRataMonthlyNet: "Monthly net",
    proRataProAmount: "Pro-Rata amount",
    proRataInvoice: "First invoice",
    proRataAddOnNotes: "Add-on notes",
    proRataNoAddOns: "No add-ons selected",
    proRataAssistantTitle: "Guided Assistant",
    proRataAssistantIntro: "Let's walk through the setup step by step.",
    proRataAssistantProductPrompt: "Which product are we working on?",
    proRataAssistantActivationPrompt: "Great! When does the service activate?",
    proRataAssistantAddOnsPrompt: "Any add-ons to include?",
    proRataAssistantConfirmPrompt: "Ready to calculate the first invoice?",
    proRataAssistantConfirm: "Confirm",
    proRataAssistantSkip: "Skip",
    proRataAssistantRestart: "Start over",
    proRataAssistantSummary: "Here's the breakdown:",
    proRataAssistantNoAddOns: "No add-ons were selected.",
    proRataAssistantReady: "Let's calculate",
    proRataAssistantActivationConfirm: "Use this date",
    proRataAssistantAddOnsConfirm: "Apply add-ons",
    proRataCopyScript: "Copy script",
    proRataCopied: "Copied",
    proRataCalculateAction: "Calculate",

    labels: {
      copyScript: "Copy Script",
      copyWhatsApp: "Copy WhatsApp",
      copyEmail: "Copy Email",
      languageToggle: "Customer Language",
      callModeToggle: "Call Mode",
      exportPDF: "Export PDF",
    },

    script: {
      main:
        "I want to clarify that **the first invoice is {{firstInvoice}}** for {{product}}. It already includes a **proration amount of {{proRata}}** covering the period from {{periodStart}} to {{periodEnd}}, plus the **regular monthly subscription {{monthlyNet}}**. Activation on {{activationDate}} creates a ratio of {{ratio}}, the billing anchor is the {{anchorDay}} of each month, and the included add-ons are: {{addOnsList}}.",
      callMode:
        "Billing anchor is the {{anchorDay}} each month. First bill = pro-rata from {{activationDate}} to {{periodEnd}} + one full month. Ratio {{ratio}}. Add-ons: {{addOnsListOrNone}}. First invoice {{firstInvoice}} JD (all-inclusive). Monthly afterwards {{monthlyNet}} JD.",
      addonLine:
        "Note: {{label}} is available for {{price}} JD per month and has been included.",
      allInclusiveNote:
        "The first invoice shown here is all-inclusive (plan + add-ons + pro-rata). Details below are for explanation only.",
    },
  },
  ar: {
    // Header
    logo: "أداة أورانج",
    openAssistant: "افتح المساعد",
    launchCalculator: "إطلاق الحاسبة",
    
    // Hero
    heroTitle: "أدوات ذكية",
    heroTitleHighlight: "للأعمال الحديثة",
    heroSubtitle: "حسابات قوية وتحليلات ذكية ونتائج فورية في متناول يدك",
    
    // KPIs
    kpi1Title: "وقت الاستجابة",
    kpi1Value: "<50 ملي",
    kpi1Label: "سريع جداً",
    kpi2Title: "الجاهزية",
    kpi2Value: "99.9%",
    kpi2Label: "متاح دائماً",
    kpi3Title: "المراقبة",
    kpi3Value: "24/7",
    kpi3Label: "على مدار الساعة",
    kpi4Title: "الدقة",
    kpi4Value: "100%",
    kpi4Label: "نتائج دقيقة",
    
    // Features
    feature1Title: "نتائج لحظية",
    feature1Description: "احصل على حسابات وتحليلات فورية باستخدام محرك المعالجة القوي",
    feature2Title: "برو راتا ذكي",
    feature2Description: "حسابات نسبية ذكية بدقة وأتمتة عالية",
    feature3Title: "مكتبة حية",
    feature3Description: "الوصول الفوري إلى الوثائق والموارد الشاملة",
    
    // Navigation
    home: "الرئيسية",
    calculator: "الحاسبة",
    proRata: "برو راتا",
    assistant: "المساعد",
    docs: "التوثيق",
    
    // Calculator
    calcTitle: "الحاسبة المتقدمة",
    calcSubtitle: "قم بإجراء حسابات معقدة بسهولة",
    calcInput1: "القيمة الأولى",
    calcInput2: "القيمة الثانية",
    calcInput3: "القيمة الثالثة",
    calcType: "نوع الحساب",
    calcSimple: "بسيط",
    calcPercentage: "نسبة مئوية",
    calcCompound: "مركب",
    calculate: "احسب",
    result: "النتيجة",
    formula: "المعادلة",
    
    // Pro-Rata
    proRataTitle: "حاسبة برو راتا",
    proRataSubtitle: "احسب المبالغ النسبية بدقة",
    totalAmount: "المبلغ الإجمالي",
    totalDays: "إجمالي الأيام",
    daysUsed: "الأيام المستخدمة",
    description: "الوصف",
    proRataAmount: "مبلغ برو راتا",
    calculateProRata: "احسب برو راتا",
    
    // Assistant
    assistantTitle: "المساعد الذكي",
    assistantSubtitle: "احصل على المساعدة في حساباتك واستفساراتك",
    typeMessage: "اكتب رسالتك...",
    send: "إرسال",
    thinking: "جاري التفكير...",
    
    // Docs
    docsTitle: "التوثيق",
    docsSubtitle: "ابحث عن الإجابات وتعلم المزيد",
    searchDocs: "بحث في التوثيق...",
    noResults: "لم يتم العثور على نتائج",
    
    // Summary
    summaryTitle: "النشاط الأخير",
    summaryEmpty: "لا يوجد نشاط حديث",
    
    // Common
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    tryAgain: "حاول مرة أخرى",
    close: "إغلاق",
    cancel: "إلغاء",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    light: "فاتح",
    dark: "داكن",
    theme: "المظهر",
    language: "اللغة",
    proRataProductLabel: "المنتج",
    proRataActivationLabel: "تاريخ التفعيل",
    proRataBasePriceLabel: "السعر الشهري الأساسي",
    proRataAddOnsLabel: "الإضافات",
    proRataAddOnsPlaceholder: "اختر الإضافات",
    proRataBillAnchorLabel: "يوم الفوترة",
    proRataBillCycleInfo: "دورة الفوترة: بداية ونهاية الشهر (للمعلومة)",
    proRataHeroDescription: "اختر المنتج وتاريخ التفعيل والإضافات للحصول على شرح الفاتورة الأولى.",
    proRataBillCycleStart: "بداية دورة الفاتورة",
    proRataBillCycleEnd: "نهاية دورة الفاتورة",
    proRataBillCycleNext: "نهاية الدورة التالية",
    proRataCycleDays: "أيام الدورة",
    proRataProDays: "أيام النسبة",
    proRataRatio: "النسبة",
    proRataBase: "السعر الأساسي",
    proRataAddOnsTotal: "مجموع الإضافات",
    proRataMonthlyNet: "الصافي الشهري",
    proRataProAmount: "قيمة النسبة",
    proRataInvoice: "فاتورة البداية",
    proRataAddOnNotes: "ملاحظات الإضافات",
    proRataNoAddOns: "لا توجد إضافات",
    proRataAssistantTitle: "مساعد موجه",
    proRataAssistantIntro: "لنمشِ خطوة بخطوة لإعداد الحساب.",
    proRataAssistantProductPrompt: "ما هو المنتج الذي نعمل عليه؟",
    proRataAssistantActivationPrompt: "رائع! متى يتم التفعيل؟",
    proRataAssistantAddOnsPrompt: "هل توجد إضافات ترغب بإضافتها؟",
    proRataAssistantConfirmPrompt: "جاهز لحساب الفاتورة الأولى؟",
    proRataAssistantConfirm: "تأكيد",
    proRataAssistantSkip: "تخطي",
    proRataAssistantRestart: "البدء من جديد",
    proRataAssistantSummary: "إليك الملخص:",
    proRataAssistantNoAddOns: "لم يتم اختيار إضافات.",
    proRataAssistantReady: "لنحسب",
    proRataAssistantActivationConfirm: "اعتماد التاريخ",
    proRataAssistantAddOnsConfirm: "تطبيق الإضافات",
    proRataCopyScript: "نسخ النص",
    proRataCopied: "تم النسخ",
    proRataCalculateAction: "احسب",

    labels: {
      copyScript: "نسخ السكربت",
      copyWhatsApp: "نسخ للواتساب",
      copyEmail: "نسخ للبريد",
      languageToggle: "لغة العميل",
      callModeToggle: "وضع المكالمات",
      exportPDF: "تصدير PDF",
    },

    script: {
      main:
        "أوضّح لحضرتك أن **قيمة أول فاتورة هي {{firstInvoice}}** لمنتج {{product}}. تتضمن هذه الفاتورة **نسبة وتناسب بقيمة {{proRata}}** عن الفترة من {{periodStart}} حتى {{periodEnd}}، إضافةً إلى **الاشتراك الشهري {{monthlyNet}}**. التفعيل بتاريخ {{activationDate}} يعطي نسبة {{ratio}}، ويوم التثبيت على الفوترة هو {{anchorDay}} من كل شهر، والإضافات الحالية هي: {{addOnsList}}.",
      callMode:
        "دورة الفوترة تثبت على يوم {{anchorDay}} من كل شهر. أول فاتورة = نسبة من {{activationDate}} إلى {{periodEnd}} + شهر مقدم. النسبة {{ratio}}. الإضافات: {{addOnsListOrNone}}. أول فاتورة {{firstInvoice}} دينار (شامل). الشهري بعد ذلك {{monthlyNet}} دينار.",
      addonLine:
        "علماً أنّه توجد خدمة {{label}} بقيمة {{price}} JD تُضاف شهرياً.",
      allInclusiveNote:
        "المبلغ المعروض كأول فاتورة شامل الاشتراك والإضافات والحسبة النسبية؛ نعرضه هنا مفصّلًا للتوضيح فقط.",
    },
  },
} as const;

export type Language = keyof typeof translations;
