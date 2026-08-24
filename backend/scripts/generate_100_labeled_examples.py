import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.engine.embeddings import embed_text
from app.models import LabeledExample, Merchant, Product
from app.models._ids import new_id

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RAW_EXAMPLES = [
    # --- 1 to 45: Purchase Intent (Egyptian Arabic, Standard Arabic, Franco) ---
    {
        "text": "عايز اطلب فستان كتان بيج مقاس لارج لو سمحت. العنوان 15 شارع مصدق الدقي ورقم التليفون 01012345678 والدفع كاش عند الاستلام",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "فستان كتان بيج", "quantity": 1, "notes": "مقاس لارج"}],
            "address": "15 شارع مصدق الدقي",
            "phone": "01012345678",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "3ayza 1 summer linen dress white size M le 3onwan el maadi shara3 9 3omara 12 w da ramy 01122334455 cash",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "summer linen dress white", "quantity": 1, "notes": "size M"}],
            "address": "el maadi shara3 9 3omara 12",
            "phone": "01122334455",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.96,
        },
    },
    {
        "text": "محتاج ٢ جاكيت جينز ازرق مقاس XL العنوان التجمع الخامس الحي النرجس فيلا 45 ورقمي 01223344556 وهدفع انستاباي",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "جاكيت جينز ازرق", "quantity": 2, "notes": "مقاس XL"}],
            "address": "التجمع الخامس الحي النرجس فيلا 45",
            "phone": "01223344556",
            "payment_method": "instapay",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "law sama7t 3ayez 2 denim jacket blue size L w 1 dress beige size S. mobile: 01099887766, address: Sheikh Zayed District 11",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "denim jacket blue", "quantity": 2, "notes": "size L"},
                {"product_name": "dress beige", "quantity": 1, "notes": "size S"},
            ],
            "address": "Sheikh Zayed District 11",
            "phone": "01099887766",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.95,
        },
    },
    {
        "text": "ابعتلي شنطة كروس جلد سوداء وواحد فستان صيفي ابيض سمول. اسكندرية سموحة شارع فوزي معاذ عمارة ٨ الدور ٣ فون 01551234567 كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "شنطة كروس جلد", "quantity": 1, "notes": "سوداء"},
                {"product_name": "فستان صيفي ابيض", "quantity": 1, "notes": "سمول"},
            ],
            "address": "اسكندرية سموحة شارع فوزي معاذ عمارة ٨ الدور ٣",
            "phone": "01551234567",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "order please: 1 leather crossbody bag black to Heliopolis street Nozha 44, tel: 01001122334 cod",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "leather crossbody bag black", "quantity": 1, "notes": None}],
            "address": "Heliopolis street Nozha 44",
            "phone": "01001122334",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.96,
        },
    },
    {
        "text": "مساء الخير، عايز احجز الجاكيت الجينز مقاس XXL، التوصيل لمدينة نصر اخر عباس العقاد رقم التليفون 01111222333",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "الجاكيت الجينز", "quantity": 1, "notes": "مقاس XXL"}],
            "address": "مدينة نصر اخر عباس العقاد",
            "phone": "01111222333",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.94,
        },
    },
    {
        "text": "3ayza 2 festive dresses linen white size Small. el 3onwan: Mansoura mashaya el sofly bnt 10. Phone: 01200998877",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "festive dresses linen white", "quantity": 2, "notes": "size Small"}],
            "address": "Mansoura mashaya el sofly bnt 10",
            "phone": "01200998877",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.95,
        },
    },
    {
        "text": "لو سمحت محتاج ٣ قطع من الفستان الصيفي مقاس M الوان مختلفة ابيض وبيج، طنطا شارع البحر برج النور، 01023456789 فودافون كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "الفستان الصيفي", "quantity": 3, "notes": "مقاس M الوان مختلفة ابيض وبيج"}],
            "address": "طنطا شارع البحر برج النور",
            "phone": "01023456789",
            "payment_method": "vodafone_cash",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "momken a7gez el jacket jeans blue size M? address: Shobra street 15 app 4, tel: 01144556677",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "jacket jeans blue", "quantity": 1, "notes": "size M"}],
            "address": "Shobra street 15 app 4",
            "phone": "01144556677",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.95,
        },
    },
    {
        "text": "عايز اشتري الفستان الكتان الابيض مقاس ميديم. ابعتهولي على ٦ اكتوبر الحي المتميز مجاورة ٢ فيلا ١٢ رقم 01033445566",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "الفستان الكتان الابيض", "quantity": 1, "notes": "مقاس ميديم"}],
            "address": "٦ اكتوبر الحي المتميز مجاورة ٢ فيلا ١٢",
            "phone": "01033445566",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.96,
        },
    },
    {
        "text": "ya basha 3ayez 1 jeans jacket L w 1 linen dress beige L le mohandseen gameat el dewal tel 01277889900 vodafone cash",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "jeans jacket", "quantity": 1, "notes": "size L"},
                {"product_name": "linen dress beige", "quantity": 1, "notes": "size L"},
            ],
            "address": "mohandseen gameat el dewal",
            "phone": "01277889900",
            "payment_method": "vodafone_cash",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "أرغب في تأكيد طلب فستان كتان بيج مقاس لارج، التوصيل إلى حي الزمالك شارع أبو الفدا عمارة ٥، هاتف 01199884433",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "فستان كتان بيج", "quantity": 1, "notes": "مقاس لارج"}],
            "address": "حي الزمالك شارع أبو الفدا عمارة ٥",
            "phone": "01199884433",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.98,
        },
    },
    {
        "text": "3ayza 1 shanta cross bag black. Address: Zagazig shara3 el kawmia 01066778899 el daf3 cash",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "shanta cross bag black", "quantity": 1, "notes": None}],
            "address": "Zagazig shara3 el kawmia",
            "phone": "01066778899",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.96,
        },
    },
    {
        "text": "لو تكرمت ابعتلي قطعتين جاكيت جينز مقاس لارج ومقاس اكس لارج على شبين الكوم شارع الجلاء، الموبايل 01559988776",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "جاكيت جينز", "quantity": 2, "notes": "مقاس لارج ومقاس اكس لارج"}],
            "address": "شبين الكوم شارع الجلاء",
            "phone": "01559988776",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.96,
        },
    },
    {
        "text": "send me 1 summer linen dress size small beige. address: Rehab City group 112 bldg 4. mobile: 01011447788 payment: instapay",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "summer linen dress", "quantity": 1, "notes": "size small beige"}],
            "address": "Rehab City group 112 bldg 4",
            "phone": "01011447788",
            "payment_method": "instapay",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "عاوز اطلب الفستان الصيفي مقاس M بيج وجاكيت جينز L، الجيزة شارع فيصل محطة العشرين رقم 01288994455 كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "الفستان الصيفي", "quantity": 1, "notes": "مقاس M بيج"},
                {"product_name": "جاكيت جينز", "quantity": 1, "notes": "مقاس L"},
            ],
            "address": "الجيزة شارع فيصل محطة العشرين",
            "phone": "01288994455",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "ana 3ayez 1 denim jacket size XL 3ala el 3onwan da: Madinaty B2 bldg 14 apt 2. Tel 01133221100",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "denim jacket", "quantity": 1, "notes": "size XL"}],
            "address": "Madinaty B2 bldg 14 apt 2",
            "phone": "01133221100",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.95,
        },
    },
    {
        "text": "احجزلي شنطة جلد كروس سودا، هحول فودافون كاش، العنوان الهرم شارع العريش عمارة ٢، موبايل 01055667788",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "شنطة جلد كروس", "quantity": 1, "notes": "سودا"}],
            "address": "الهرم شارع العريش عمارة ٢",
            "phone": "01055667788",
            "payment_method": "vodafone_cash",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "please 1 linen dress white size L and 1 blue jeans jacket XL to Hurghada El Kawther, phone 01233445599",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "linen dress white", "quantity": 1, "notes": "size L"},
                {"product_name": "blue jeans jacket", "quantity": 1, "notes": "size XL"},
            ],
            "address": "Hurghada El Kawther",
            "phone": "01233445599",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.96,
        },
    },
    {
        "text": "عايز واحد جاكيت جينز مقاس ميديم للتوصيل لبنها شارع فريد ندا رقم التليفون 01554433221 الدفع عند الاستلام",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "جاكيت جينز", "quantity": 1, "notes": "مقاس ميديم"}],
            "address": "بنها شارع فريد ندا",
            "phone": "01554433221",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "3ayza 1 dress ketan white size S w 1 bag cross. Giza Dokki st 4. Tel 01099112233 cod please",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "dress ketan white", "quantity": 1, "notes": "size S"},
                {"product_name": "bag cross", "quantity": 1, "notes": None},
            ],
            "address": "Giza Dokki st 4",
            "phone": "01099112233",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "محتاج اطلب ٣ فساتين صيفي ابيض مقاس لارج. بورسعيد شارع محمد علي برج الروضة 01188776655 الدفع فوري",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "فساتين صيفي ابيض", "quantity": 3, "notes": "مقاس لارج"}],
            "address": "بورسعيد شارع محمد علي برج الروضة",
            "phone": "01188776655",
            "payment_method": "fawry",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "I want to buy 1 Classic Denim Jacket size XXL, deliver to Suez Port Tawfik, mobile 01211223344",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "Classic Denim Jacket", "quantity": 1, "notes": "size XXL"}],
            "address": "Suez Port Tawfik",
            "phone": "01211223344",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.96,
        },
    },
    {
        "text": "طلب فستان كتان بيج مقاس سمول، التوصيل لاسيوط شارع النميس رقم تليفوني 01088771122",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "فستان كتان بيج", "quantity": 1, "notes": "مقاس سمول"}],
            "address": "اسيوط شارع النميس",
            "phone": "01088771122",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.95,
        },
    },
    {
        "text": "hatly 2 jeans jacket L w 1 dress linen beige M. 3onwany: Nasr City Makram Ebeid st 15. Phone: 01144332211 cash",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "jeans jacket", "quantity": 2, "notes": "size L"},
                {"product_name": "dress linen beige", "quantity": 1, "notes": "size M"},
            ],
            "address": "Nasr City Makram Ebeid st 15",
            "phone": "01144332211",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "عايز ٢ شنطة كروس جلد سودا، دمياط الجديدة الحي الثالث 01552233441 والدفع انستاباي",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "شنطة كروس جلد", "quantity": 2, "notes": "سودا"}],
            "address": "دمياط الجديدة الحي الثالث",
            "phone": "01552233441",
            "payment_method": "instapay",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "momken 1 dress ketan beige size L? 01011998822, Cairo Downtown Talaat Harb street app 12",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "dress ketan beige", "quantity": 1, "notes": "size L"}],
            "address": "Cairo Downtown Talaat Harb street app 12",
            "phone": "01011998822",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.95,
        },
    },
    {
        "text": "ابعت الاوردر ده: جاكيت جينز مقاس S وفستان صيفي ابيض مقاس S، شبرا الخيمة شارع 15 مايو رقم 01277112233 كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "جاكيت جينز", "quantity": 1, "notes": "مقاس S"},
                {"product_name": "فستان صيفي ابيض", "quantity": 1, "notes": "مقاس S"},
            ],
            "address": "شبرا الخيمة شارع 15 مايو",
            "phone": "01277112233",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "3ayez 1 jacket denim size Medium le el maadi degla st 200, phone 01177665544, payment instapay",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "jacket denim", "quantity": 1, "notes": "size Medium"}],
            "address": "el maadi degla st 200",
            "phone": "01177665544",
            "payment_method": "instapay",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "عايز اشتري فستان صيفي كتان مقاس L ابيض على العنوان سوهاج شارع 15 والموبايل 01022114433",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "فستان صيفي كتان", "quantity": 1, "notes": "مقاس L ابيض"}],
            "address": "سوهاج شارع 15",
            "phone": "01022114433",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.95,
        },
    },
    {
        "text": "please 1 leather crossbody bag black, deliver to Alexandria Gleem tram station, phone 01222883311, cash on delivery",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "leather crossbody bag black", "quantity": 1, "notes": None}],
            "address": "Alexandria Gleem tram station",
            "phone": "01222883311",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "لو سمحت ابعتلي ٢ جاكيت جينز ازرق مقاس M لعنوان المنيل شارع عبد العزيز ال سعود عمارة ٤ رقمي 01044559988 كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "جاكيت جينز ازرق", "quantity": 2, "notes": "مقاس M"}],
            "address": "المنيل شارع عبد العزيز ال سعود عمارة ٤",
            "phone": "01044559988",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "3ayza 1 dress ketan beige size XL w 1 bag cross le el tagamo3 el awal bldg 22. Tel 01155661122 cod",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "dress ketan beige", "quantity": 1, "notes": "size XL"},
                {"product_name": "bag cross", "quantity": 1, "notes": None},
            ],
            "address": "el tagamo3 el awal bldg 22",
            "phone": "01155661122",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "محتاج اطلب فستان كتان بيج مقاس لارج لعنوان العبور الحي الاول محل رقم 5، تليفون 01557788990 والدفع فودافون كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "فستان كتان بيج", "quantity": 1, "notes": "مقاس لارج"}],
            "address": "العبور الحي الاول محل رقم 5",
            "phone": "01557788990",
            "payment_method": "vodafone_cash",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "send 1 denim jacket size Large to Giza Haram st 10 apt 3, phone 01099223344, instapay",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "denim jacket", "quantity": 1, "notes": "size Large"}],
            "address": "Giza Haram st 10 apt 3",
            "phone": "01099223344",
            "payment_method": "instapay",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "عايز فستان صيفي كتان ابيض مقاس S على عنوان كفر الشيخ شارع النبوي المهندس رقم 01288442211 والدفع كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "فستان صيفي كتان ابيض", "quantity": 1, "notes": "مقاس S"}],
            "address": "كفر الشيخ شارع النبوي المهندس",
            "phone": "01288442211",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "3ayez 2 denim jacket blue size M le Ismailia shara3 el thalathiny tel 01188332211 cash",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "denim jacket blue", "quantity": 2, "notes": "size M"}],
            "address": "Ismailia shara3 el thalathiny",
            "phone": "01188332211",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },
    {
        "text": "احجزلي واحد فستان كتان بيج مقاس M، التوصيل للشروق المنطقة الاولى عمارة 8 شقة 2 رقم الموبايل 01011883377 كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "فستان كتان بيج", "quantity": 1, "notes": "مقاس M"}],
            "address": "الشروق المنطقة الاولى عمارة 8 شقة 2",
            "phone": "01011883377",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "law sama7t 1 leather bag cross w 1 dress white size L. Address: Fayoum shara3 el bahr. Phone: 01550011223",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [
                {"product_name": "leather bag cross", "quantity": 1, "notes": None},
                {"product_name": "dress white", "quantity": 1, "notes": "size L"},
            ],
            "address": "Fayoum shara3 el bahr",
            "phone": "01550011223",
            "payment_method": None,
            "ambiguous_fields": ["payment_method"],
            "confidence": 0.96,
        },
    },
    {
        "text": "مساء الخير عايز اطلب ٢ جاكيت جينز مقاس L ومقاس M العنوان حدائق الاهرام البوابة التانية عمارة 110 هاتف 01033229988 كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "جاكيت جينز", "quantity": 2, "notes": "مقاس L ومقاس M"}],
            "address": "حدائق الاهرام البوابة التانية عمارة 110",
            "phone": "01033229988",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "3ayza 1 summer dress linen beige size Small to New Cairo Kattameya Heights villa 10. Phone: 01222990011 payment: visa",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "summer dress linen beige", "quantity": 1, "notes": "size Small"}],
            "address": "New Cairo Kattameya Heights villa 10",
            "phone": "01222990011",
            "payment_method": "visa",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "ابعتلي فستان كتان ابيض مقاس اكس لارج لشارع جامعة الدول المهندسين تليفون 01122994477 كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "فستان كتان ابيض", "quantity": 1, "notes": "مقاس اكس لارج"}],
            "address": "شارع جامعة الدول المهندسين",
            "phone": "01122994477",
            "payment_method": "cash_on_delivery",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "order please: 2 denim jackets size XL to Alexandria Roushdy st 5, mobile 01009988112, instapay",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "denim jackets", "quantity": 2, "notes": "size XL"}],
            "address": "Alexandria Roushdy st 5",
            "phone": "01009988112",
            "payment_method": "instapay",
            "ambiguous_fields": [],
            "confidence": 0.98,
        },
    },
    {
        "text": "عايز اشتري شنطة جلد سودا كروس مقاس عادي، التوصيل لحلوان شارع راغب رقمي 01200114488 وهدفع فودافون كاش",
        "intent": "purchase_intent",
        "extraction": {
            "line_items": [{"product_name": "شنطة جلد سودا كروس", "quantity": 1, "notes": "مقاس عادي"}],
            "address": "حلوان شارع راغب",
            "phone": "01200114488",
            "payment_method": "vodafone_cash",
            "ambiguous_fields": [],
            "confidence": 0.97,
        },
    },

    # --- 46 to 70: Product & Service Inquiries / Questions ---
    {
        "text": "السلام عليكم، هو الفستان الكتان الصيفي متاح منه مقاس لارج ولا خلص؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "Momken a3raf el jacket el jeans be kam w feh menno alwan tanya?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "لو سمحت مصاريف الشحن لاسكندرية كام وبياخد كام يوم على ما يوصل؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "howa feh delivery le 6 October w el shahn be kam?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "هل خامة الفستان الكتان قطن طبيعي ولا مخلوط بوليستر؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "be kam el shanta el cross el leather w feh menha alwan?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "بكام الجاكيت الجينز وهل المقاسات مضبوطة ولا صغيرة؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "Momken table el ma2asat (size chart) le el dresses?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "ممكن اعرف لو المقاس طلع مش مناسب ينفع ابدل او ارجع؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "feh payment methods eh? momken adfa3 instapay aw visa?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "هو انتوا عندكم فرع اقدر اجي اقيس فيه ولا اونلاين بس؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "el delivery le el Sa3eed (Asyut / Sohag) beya5od ad eh wa2t?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "لو طلبت قطعتين فستان وجاكيت في خصم ولا عرض على الشحن؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "howa el dress el abyad shaffaf wala mebatan?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "هو الشحن مجاني لو طلبت فوق الـ 1000 جنيه؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "feh men el denim jacket ma2as 3XL aw oversize?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "ينفع اعاين الاوردر مع المندوب واقيس قبل ما ادفع واستلم؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "Momken sowar 3ala el tabi3a le el shanta el cross?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "هل متاح دفع عند الاستلام لكل المحافظات؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "howa el 3ard da sha8al le 7ad emta?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "لو سمحت الفستان البيج ده لونه بيج فاتح ولا جملي؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "bkam el dress el ketan law sama7t?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "هو انتوا فاتحين يوم الجمعة ولا اجازة؟",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "Momken a3raf se3r el shahn le el Mansoura?",
        "intent": "question",
        "extraction": None,
    },
    {
        "text": "هو الجاكيت الجينز ده صيفي خفيف ولا تقيل للشتا؟",
        "intent": "question",
        "extraction": None,
    },

    # --- 71 to 80: Greetings & Social Openers ---
    {
        "text": "السلام عليكم ورحمة الله وبركاته",
        "intent": "greeting",
        "extraction": None,
    },
    {
        "text": "sba7 el kher ya fannadom",
        "intent": "greeting",
        "extraction": None,
    },
    {
        "text": "مساء الورد، موجودين؟",
        "intent": "greeting",
        "extraction": None,
    },
    {
        "text": "Hi, momken astafser 3an 7aga?",
        "intent": "greeting",
        "extraction": None,
    },
    {
        "text": "أهلا بحضرتك يا فندم، محتاج مساعدة",
        "intent": "greeting",
        "extraction": None,
    },
    {
        "text": "Salam 3alaykom, ezayak ya basha",
        "intent": "greeting",
        "extraction": None,
    },
    {
        "text": "صباح الخير، عايز اسأل على حاجة",
        "intent": "greeting",
        "extraction": None,
    },
    {
        "text": "Hello, is anyone available to help me?",
        "intent": "greeting",
        "extraction": None,
    },
    {
        "text": "مرحبا، هل الدعم الفني متواجد الآن؟",
        "intent": "greeting",
        "extraction": None,
    },
    {
        "text": "Masa2 el kheir ya gama3a",
        "intent": "greeting",
        "extraction": None,
    },

    # --- 81 to 92: Complaints, Modifications, Tracking, Cancellations ---
    {
        "text": "معلش انا كنت طلبت امبارح بس عايز اغير مقاس الجاكيت اخليه XL بدل L قبل ما تشحنوا",
        "intent": "other",
        "extraction": None,
    },
    {
        "text": "el order beta3y et2akhar awee ba2alo 5 ayam w ma7adesh kalamny!",
        "intent": "complaint",
        "extraction": None,
    },
    {
        "text": "لو سمحت عايز اكنسل الاوردر اللي عملته الصبح علشان مسافر",
        "intent": "other",
        "extraction": None,
    },
    {
        "text": "Feh moshkela fel dress elly wesel, el soosata maftooha w bayza, 3ayez a3mel return",
        "intent": "complaint",
        "extraction": None,
    },
    {
        "text": "المندوب وصل بس جابلي لون غلط انا طلبت بيج وجالي ابيض، ايه الحل؟",
        "intent": "complaint",
        "extraction": None,
    },
    {
        "text": "Momken track number le el shipment beta3ty?",
        "intent": "other",
        "extraction": None,
    },
    {
        "text": "عايز اغير عنوان التوصيل من المعادي للمهندسين لو لسه ما خرجش مع المندوب",
        "intent": "other",
        "extraction": None,
    },
    {
        "text": "law sama7t 3ayez astared el floos 3ashan el montag ma3agabnesh",
        "intent": "complaint",
        "extraction": None,
    },
    {
        "text": "هو ليه المندوب طلب مني فلوس شحن زيادة عن اللي اتفقنا عليه في الشات؟",
        "intent": "complaint",
        "extraction": None,
    },
    {
        "text": "3ayez a8ayar el raqam elly el mandoob haykelmny 3aleeh",
        "intent": "other",
        "extraction": None,
    },
    {
        "text": "المنتج وصل والخامة ممتازة بس المقاس طلع واسع سيكا، محتاج ابدل لمقاس اصغر",
        "intent": "other",
        "extraction": None,
    },
    {
        "text": "feen el order beta3y ya gama3a? el mandoob magash fel ma3ad",
        "intent": "complaint",
        "extraction": None,
    },

    # --- 93 to 97: Reactions & Short Acknowledgments ---
    {
        "text": "تمام شكرا جدا لحضرتك في انتظار الاوردر",
        "intent": "reaction",
        "extraction": None,
    },
    {
        "text": "Ok merci awee ya fannadom 👍",
        "intent": "reaction",
        "extraction": None,
    },
    {
        "text": "تسلم ايدك يا غالي، الف شكر",
        "intent": "reaction",
        "extraction": None,
    },
    {
        "text": "Tamam, alf shokr",
        "intent": "reaction",
        "extraction": None,
    },
    {
        "text": "جزاك الله خيرا، بالتوفيق",
        "intent": "reaction",
        "extraction": None,
    },

    # --- 98 to 100: Spam / Irrelevant ---
    {
        "text": "فرصة عمل للشباب من المنزل براتب يصل الى 10000 جنيه شهريا اضغط هنا https://work-from-home-eg.com",
        "intent": "spam",
        "extraction": None,
    },
    {
        "text": "Check out this free crypto trading bot link: http://crypto-win-easy.net/ref=123",
        "intent": "spam",
        "extraction": None,
    },
    {
        "text": "زيادة متابعين ولايكات انستجرام وفيسبوك باقل الاسعار تواصل واتس https://followers-boost.me",
        "intent": "spam",
        "extraction": None,
    },
]


async def generate_and_insert():
    logger.info("Connecting to database: %s", settings.sqlalchemy_database_uri)
    engine = create_async_engine(settings.sqlalchemy_database_uri)

    async with AsyncSession(engine) as session:
        res = await session.execute(select(Merchant.id).limit(1))
        merchant_id = res.scalar_one_or_none()
        if not merchant_id:
            logger.info("No merchant found, creating default merchant...")
            merchant = Merchant(id=new_id(), name="Tijaratk Boutique")
            session.add(merchant)
            await session.flush()
            merchant_id = merchant.id

        logger.info("Using merchant_id: %s", merchant_id)
        logger.info("Total examples to process: %d", len(RAW_EXAMPLES))

        semaphore = asyncio.Semaphore(5)  # Limit concurrent embedding requests

        async def process_one(item: dict, idx: int):
            async with semaphore:
                text = item["text"]
                try:
                    vec = await embed_text(text)
                except Exception as e:
                    logger.warning("Failed embedding for item %d: %s, error: %s", idx, text[:30], e)
                    vec = None

                return LabeledExample(
                    id=new_id(),
                    merchant_id=merchant_id,
                    normalized_text=text,
                    intent=item["intent"],
                    extraction=item.get("extraction"),
                    embedding=vec,
                    source="seed_100_phrases",
                )

        tasks = [process_one(item, i) for i, item in enumerate(RAW_EXAMPLES)]
        examples = await asyncio.gather(*tasks)

        session.add_all(examples)
        await session.commit()

        count_res = await session.execute(select(LabeledExample).where(LabeledExample.source == "seed_100_phrases"))
        inserted_count = len(count_res.scalars().all())

        logger.info("✅ Successfully inserted %d labeled examples into the DB!", inserted_count)


if __name__ == "__main__":
    asyncio.run(generate_and_insert())
