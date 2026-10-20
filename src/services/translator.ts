export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇲🇽' },
  { code: 'zh', name: 'Mandarin Chinese', nativeName: '中文 (简体)', flag: '🇨🇳' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'tl', name: 'Tagalog / Filipino', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
];

export const CORE_LEGAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  'I am exercising my right to remain silent.': {
    es: 'Estoy ejerciendo mi derecho a guardar silencio.',
    zh: '我正在行使我的保持沉默权。',
    vi: 'Tôi đang thực hiện quyền giữ im lặng của mình.',
    tl: 'Ginagamit ko ang aking karapatang manahimik.',
    ar: 'أنا أمارس حقي الدستوري في التزام الصمت.',
    fr: 'J\'exerce mon droit constitutionnel de garder le silence.',
    ko: '저는 헌법상 묵비권을 행사하고 있습니다.',
    ru: 'Я пользуюсь своим конституционным правом сохранять молчание.',
    pt: 'Estou exercendo meu direito constitucional de permanecer em silêncio.',
    hi: 'मैं चुप रहने के अपने संवैधानिक अधिकार का प्रयोग कर रहा हूँ।'
  },
  'I do not consent to any search of my person or vehicle.': {
    es: 'No doy mi consentimiento para ningún registro de mi persona o vehículo.',
    zh: '我不同意对我的身体或车辆进行任何搜查。',
    vi: 'Tôi không đồng ý cho khám xét người hoặc xe của tôi.',
    tl: 'Hindi ako sumasang-ayon sa anumang paghahanap sa aking katawan o sasakyan.',
    ar: 'لا أوافق على أي تفتيش لشخصي أو لسيارتي.',
    fr: 'Je refuse expressément toute fouille de ma personne ou de mon véhicule.',
    ko: '저나 제 차량에 대한 어떠한 수색에도 동의하지 않습니다.',
    ru: 'Я не даю согласия на обыск себя или моего автомобиля.',
    pt: 'Não consinto expressamente com nenhuma revista em minha pessoa ou veículo.',
    hi: 'मैं अपने व्यक्ति या वाहन की किसी भी तलाशी की सहमति नहीं देता।'
  },
  'Officer, am I being detained or am I free to go?': {
    es: 'Oficial, ¿estoy detenido o soy libre de irme?',
    zh: '警官，请问我被拘留了还是可以自由离开？',
    vi: 'Thưa sĩ quan, tôi đang bị giữ lại hay tôi được tự do đi?',
    tl: 'Opisyal, ako ba ay pinipigilan o malaya na akong umalis?',
    ar: 'حضرة الضابط، هل أنا محتجز رسمياً أم أنني حر في المغادرة؟',
    fr: 'Officier, suis-je légalement détenu ou suis-je libre de partir ?',
    ko: '경찰관님, 제가 구금 중입니까, 아니면 가도 됩니까?',
    ru: 'Офицер, я задержан или свободен идти?',
    pt: 'Oficial, estou legalmente detido ou sou livre para ir embora?',
    hi: 'अधिकारी महोदय, क्या मुझे हिरासत में लिया गया है या मैं जाने के लिए स्वतंत्र हूँ?'
  },
  'I want to speak with my attorney.': {
    es: 'Quiero hablar con mi abogado antes de responder preguntas.',
    zh: '在回答任何问题之前，我想和我的律师通话。',
    vi: 'Tôi muốn nói chuyện với luật sư của tôi trước khi trả lời câu hỏi.',
    tl: 'Nais kong makausap ang aking abogado bago sumagot.',
    ar: 'أريد التحدث مع محامي الخاص قبل الإجابة على أي أسئلة.',
    fr: 'Je demande à parler à mon avocat avant de répondre à toute question.',
    ko: '질문에 답변하기 전에 변호사와 상담하고 싶습니다.',
    ru: 'Я требую разговора с адвокатом до ответа на любые вопросы.',
    pt: 'Quero falar com meu advogado antes de responder a qualquer pergunta.',
    hi: 'प्रश्नों का उत्तर देने से पहले मैं अपने वकील से बात करना चाहता हूँ।'
  },
  'I will comply with your order to step out of the vehicle, but I decline any searches.': {
    es: 'Cumpliré con su orden de salir del vehículo, pero me niego a cualquier registro voluntario.',
    zh: '我服从您下车的要求，但我明确拒绝任何搜查或自愿测试。',
    vi: 'Tôi sẽ tuân thủ lệnh bước ra khỏi xe, nhưng tôi từ chối mọi cuộc khám xét.',
    tl: 'Susunod ako sa iyong utos na lumabas sa sasakyan, ngunit tumatanggi ako sa anumang paghahanap.',
    ar: 'سأمتثل لأمرك بالخروج من السيارة، لكنني أرفض بشكل قاطع أي تفتيش أو اختبارات اختيارية.',
    fr: 'J\'obtempère à votre ordre de descendre du véhicule, mais je refuse toute fouille.',
    ko: '차량에서 내리라는 명령에는 따르겠으나, 어떠한 수색에도 동의하지 않습니다.',
    ru: 'Я подчиняюсь вашему приказу выйти из автомобиля, но отказываюсь от любых обысков.',
    pt: 'Vou obedecer à sua ordem para sair do veículo, mas recuso qualquer revista ou teste voluntário.',
    hi: 'मैं वाहन से बाहर निकलने के आपके आदेश का पालन करूँगा, लेकिन मैं किसी भी तलाशी को अस्वीकार करता हूँ।'
  },
  'Do you have a search warrant signed by a judge?': {
    es: '¿Tiene una orden judicial de registro firmada por un juez?',
    zh: '请问您有法官签署的正式搜查令吗？',
    vi: 'Bạn có lệnh khám xét có chữ ký của thẩm phán không?',
    tl: 'Mayroon ka bang search warrant na nilagdaan ng hukom?',
    ar: 'هل لديك مذكرة تفتيش قضائية موقعة من قاضٍ؟',
    fr: 'Avez-vous un mandat de perquisition formel signé par un juge ?',
    ko: '판사가 서명한 정식 압수수색 영장이 있습니까?',
    ru: 'У вас есть судебный ордер на обыск, подписанный судьей?',
    pt: 'Você tem um mandado judicial de busca assinado por um juiz?',
    hi: 'क्या आपके पास किसी न्यायाधीश द्वारा हस्ताक्षरित आधिकारिक तलाशी वारंट है?'
  },
  'Notice: This interaction is being recorded under the First Amendment.': {
    es: 'Aviso: Esta interacción está siendo grabada bajo la protección de la Primera Enmienda.',
    zh: '请注意：根据宪法第一修正案，本次互动正在进行合法的音视频记录。',
    vi: 'Thông báo: Tương tác này đang được ghi lại theo Tu chính án thứ nhất.',
    tl: 'Paunawa: Ang interaksyong ito ay nirerekord alinsunod sa First Amendment.',
    ar: 'تنبيه: يتم تسجيل هذا التفاعل بالصوت والصورة بموجب التعديل الأول للدستور الأمريكي.',
    fr: 'Avis : Cette interaction est enregistrée conformément au Premier Amendement.',
    ko: '알림: 본 상호작용은 미국 수정헌법 제1조에 따라 합법적으로 녹음 및 녹화 중입니다.',
    ru: 'Внимание: Данное взаимодействие записывается на аудио и видео в рамках Первой поправки.',
    pt: 'Aviso: Esta interação está sendo gravada sob a proteção da Primeira Emenda.',
    hi: 'सूचना: यह बातचीत अमेरिकी संविधान के प्रथम संशोधन के तहत रिकॉर्ड की जा रही है।'
  },
  'I am deaf or hard of hearing. Please provide written instructions.': {
    es: 'Soy sordo o tengo dificultades auditivas. Por favor, deme instrucciones por escrito.',
    zh: '我是聋人/听障人士。请您用书面文字向我说明指示。',
    vi: 'Tôi bị điếc hoặc khiếm thính. Vui lòng cung cấp hướng dẫn bằng văn bản.',
    tl: 'Ako ay bingi o mahina ang pandinig. Pakiusap, ibigay ang mga tagubilin nang nakasulat.',
    ar: 'أنا أصم / أعاني من ضعف في السمع. يرجى تزويدي بالتعليمات كتابة.',
    fr: 'Je suis sourd ou malentendant. Veuillez me donner des instructions écrites.',
    ko: '저는 청각장애가 있습니다. 지시 사항을 글씨로 적어 보여주십시오.',
    ru: 'Я глухой / слабослышащий. Пожалуйста, предоставьте письменные инструкции.',
    pt: 'Sou surdo ou com deficiência auditiva. Por favor, forneça instruções por escrito.',
    hi: 'मैं बधिर या सुनने में असमर्थ हूँ। कृपया लिखित निर्देश प्रदान करें।'
  },
  'I do not speak English fluently. I am using this assistant to protect my rights.': {
    es: 'No hablo inglés con fluidez. Estoy usando este asistente para comunicar mis derechos constitucionales.',
    zh: '我的英语不够流利。我正在使用这款辅助工具来准确传达我的宪法权利。',
    vi: 'Tôi không nói tiếng Anh lưu loát. Tôi đang sử dụng trợ lý này để bảo vệ quyền của mình.',
    tl: 'Hindi ako matatas mag-Ingles. Ginagamit ko ang gabay na ito upang iparating ang aking mga karapatan.',
    ar: 'أنا لا أتحدث الإنجليزية بطلاقة. أستخدم هذا المساعد للتواصل وحماية حقوقي الدستورية.',
    fr: 'Je ne parle pas couramment anglais. J\'utilise cet assistant pour faire valoir mes droits.',
    ko: '저는 영어가 유창하지 않습니다. 헌법상 권리를 정확히 전달하기 위해 본 도구를 사용하고 있습니다.',
    ru: 'Я не свободно владею английским языком. Я использую данного помощника для защиты своих прав.',
    pt: 'Não falo inglês fluentemente. Estou usando este assistente para comunicar meus direitos.',
    hi: 'मैं धाराप्रवाह अंग्रेजी नहीं बोलता। मैं अपने अधिकारों की रक्षा के लिए इस सहायक का उपयोग कर रहा हूँ।'
  },
  'Here is my driver\'s license, registration, and insurance.': {
    es: 'Aquí están mi licencia de conducir, registro y seguro.',
    zh: '这是我的驾驶执照、车辆登记和保险单。',
    vi: 'Đây là bằng lái xe, đăng ký xe và bảo hiểm của tôi.',
    tl: 'Narito ang aking lisensya sa pagmamaneho, rehistro, at insurance.',
    ar: 'تفضل رخصة القيادة واستمارة تسجيل المركبة ووثيقة التأمين.',
    fr: 'Voici mon permis de conduire, l\'immatriculation du véhicule et l\'assurance.',
    ko: '여기 운전면허증, 차량 등록증, 보험증서입니다.',
    ru: 'Вот мое водительское удостоверение, регистрация автомобиля и страховой полис.',
    pt: 'Aqui estão minha carteira de motorista, registro do veículo e seguro.',
    hi: 'यह मेरा ड्राइविंग लाइसेंस, वाहन पंजीकरण और बीमा दस्तावेज है।'
  },
  'I am keeping my hands visible on the steering wheel.': {
    es: 'Mantengo mis manos visibles sobre el volante.',
    zh: '我的双手正清晰地放在方向盘上。',
    vi: 'Tôi đang giữ tay ở vị trí dễ thấy trên vô lăng.',
    tl: 'Inilalagay ko ang aking mga kamay sa manibela kung saan nakikita.',
    ar: 'أنا أبقي يدي واضحتين على عجلة القيادة من أجل السلامة.',
    fr: 'Je garde mes mains bien visibles sur le volant pour la sécurité de tous.',
    ko: '안전을 위해 제 두 손을 운전대 위에 잘 보이도록 올려두고 있습니다.',
    ru: 'Мои руки находятся на руле на виду ради общей безопасности.',
    pt: 'Estou mantendo minhas mãos visíveis no volante para a segurança de todos.',
    hi: 'मैं अपने हाथ स्टीयरing व्हील पर स्पष्ट रूप से रख रहा हूँ।'
  }
};

// Build reverse dictionary mapping (Foreign Language Phrase -> Official English Statement)
const REVERSE_TRANSLATIONS: Record<string, string> = {};

for (const [englishPhrase, langMap] of Object.entries(CORE_LEGAL_TRANSLATIONS)) {
  for (const [, foreignText] of Object.entries(langMap)) {
    REVERSE_TRANSLATIONS[foreignText.toLowerCase().trim()] = englishPhrase;
  }
}

export class TranslationService {
  /**
   * Translates English text to target language (Direction 1: English -> Non-English)
   */
  static translateText(text: string, targetLang: string): string {
    if (!text || !targetLang || targetLang === 'en') return text;

    const trimmed = text.trim();

    // 1. Direct match
    if (CORE_LEGAL_TRANSLATIONS[trimmed]?.[targetLang]) {
      return CORE_LEGAL_TRANSLATIONS[trimmed][targetLang];
    }

    // 2. Exact match case-insensitive
    for (const [engKey, map] of Object.entries(CORE_LEGAL_TRANSLATIONS)) {
      if (engKey.toLowerCase() === trimmed.toLowerCase() && map[targetLang]) {
        return map[targetLang];
      }
    }

    // 3. Substring replacement
    let result = text;
    for (const [key, map] of Object.entries(CORE_LEGAL_TRANSLATIONS)) {
      if (result.includes(key) && map[targetLang]) {
        result = result.replace(key, map[targetLang]);
      }
    }

    // 4. Glossary replacements for Spanish
    if (targetLang === 'es') {
      result = result
        .replace(/driver's license/gi, 'licencia de conducir')
        .replace(/registration/gi, 'registro vehicular')
        .replace(/insurance/gi, 'comprobante de seguro')
        .replace(/search/gi, 'registrar/inspeccionar')
        .replace(/trunk/gi, 'maletero/cajuela')
        .replace(/Fourth Amendment/gi, 'Cuarta Enmienda')
        .replace(/Fifth Amendment/gi, 'Quinta Enmienda')
        .replace(/step out of the vehicle/gi, 'salir del vehículo')
        .replace(/remain silent/gi, 'guardar silencio')
        .replace(/attorney/gi, 'abogado')
        .replace(/detained/gi, 'detenido')
        .replace(/free to go/gi, 'libre de irse');
    }

    return result;
  }

  /**
   * Translates non-English statements back to English (Direction 2: Non-English -> English)
   */
  static translateToEnglish(text: string, fromLang?: string): string {
    if (!text) return '';
    const trimmed = text.trim();

    if (!fromLang || fromLang === 'en') return trimmed;

    const lower = trimmed.toLowerCase();
    if (REVERSE_TRANSLATIONS[lower]) {
      return REVERSE_TRANSLATIONS[lower];
    }

    for (const [foreignPhrase, englishTarget] of Object.entries(REVERSE_TRANSLATIONS)) {
      if (lower.includes(foreignPhrase)) {
        return englishTarget;
      }
    }

    // Common Spanish civilian phrases -> English
    if (fromLang === 'es') {
      if (lower.includes('no hablo ingles') || lower.includes('no hablo inglés')) {
        return 'Officer, I do not speak English well. I am using this AI assistant to communicate my constitutional rights.';
      }
      if (lower.includes('abogado')) {
        return 'I want to speak with my attorney.';
      }
      if (lower.includes('silencio')) {
        return 'I am exercising my right to remain silent.';
      }
      if (lower.includes('no consiento') || lower.includes('no doy permiso') || lower.includes('no acepto')) {
        return 'I do not consent to any search.';
      }
      if (lower.includes('detenido') || lower.includes('libre')) {
        return 'Officer, am I being detained or am I free to go?';
      }
      if (lower.includes('orden')) {
        return 'Do you have a search warrant?';
      }
    }

    // Common Chinese civilian phrases -> English
    if (fromLang === 'zh') {
      if (lower.includes('沉默') || lower.includes('不说话')) {
        return 'I am exercising my right to remain silent.';
      }
      if (lower.includes('律师')) {
        return 'I want to speak with my attorney.';
      }
      if (lower.includes('搜查') || lower.includes('不同意')) {
        return 'I do not consent to any search.';
      }
      if (lower.includes('离开') || lower.includes('走')) {
        return 'Officer, am I being detained or am I free to go?';
      }
    }

    // Common Vietnamese civilian phrases -> English
    if (fromLang === 'vi') {
      if (lower.includes('im lặng')) {
        return 'I am exercising my right to remain silent.';
      }
      if (lower.includes('luật sư')) {
        return 'I want to speak with my attorney.';
      }
      if (lower.includes('khám xét')) {
        return 'I do not consent to any search.';
      }
    }

    return trimmed;
  }

  /**
   * Online dynamic AI translation with offline fallback
   */
  static async translateDynamic(text: string, fromLang: string, toLang: string): Promise<string> {
    if (!text || fromLang === toLang) return text;

    // Check offline dictionary first
    if (toLang === 'en') {
      const offlineEng = this.translateToEnglish(text, fromLang);
      if (offlineEng !== text) return offlineEng;
    } else if (fromLang === 'en') {
      const offlineTarget = this.translateText(text, toLang);
      if (offlineTarget !== text) return offlineTarget;
    }

    // Try online AI translation endpoint
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fromLang, toLang })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) {
          return data.translatedText;
        }
      }
    } catch (e) {
      console.warn('Online translation fallback to local rule engine:', e);
    }

    return toLang === 'en' ? this.translateToEnglish(text, fromLang) : this.translateText(text, toLang);
  }

  static isEnglishText(text: string): boolean {
    if (!text) return true;
    const latinLetters = (text.match(/[a-zA-Z]/g) || []).length;
    return latinLetters / Math.max(1, text.length) > 0.4;
  }
}
