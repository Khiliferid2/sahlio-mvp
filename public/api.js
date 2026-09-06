const API = {
  base: '',
  token() { return localStorage.getItem('sahlio_token'); },
  user() { return JSON.parse(localStorage.getItem('sahlio_user') || 'null'); },
  setSession(token, user) {
    localStorage.setItem('sahlio_token', token);
    localStorage.setItem('sahlio_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('sahlio_token');
    localStorage.removeItem('sahlio_user');
    location.reload();
  },
  async call(method, path, body) {
    const res = await fetch(this.base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token() ? { Authorization: 'Bearer ' + this.token() } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'صار مشكل، عاود جرب');
    return data;
  }
};

const ZONES = {
  'تونس': [36.8065, 10.1815],
  'أريانة': [36.8625, 10.1956],
  'بن عروس': [36.7533, 10.2282],
  'منوبة': [36.8081, 10.0972],
  'نابل': [36.4561, 10.7376],
  'زغوان': [36.4029, 10.1429],
  'بنزرت': [37.2744, 9.8739],
  'باجة': [36.7256, 9.1817],
  'جندوبة': [36.5011, 8.7757],
  'الكاف': [36.1826, 8.7148],
  'سليانة': [36.0836, 9.3708],
  'سوسة': [35.8256, 10.6084],
  'المنستير': [35.7643, 10.8113],
  'المهدية': [35.5047, 11.0622],
  'صفاقس': [34.7406, 10.7603],
  'القيروان': [35.6781, 10.0963],
  'القصرين': [35.1676, 8.8365],
  'سيدي بوزيد': [35.0381, 9.4858],
  'قابس': [33.8815, 10.0982],
  'مدنين': [33.3399, 10.4959],
  'تطاوين': [32.9297, 10.4518],
  'قبلي': [33.7044, 8.9690],
  'توزر': [33.9197, 8.1335],
  'قفصة': [34.4250, 8.7842],
};

const DELEGATIONS = {
  'تونس': ['Bab El Bhar','Bab Souika','Carthage','Cité El Khadra','Djebel Jelloud','El Hraïria','El Kabaria','El Menzah','El Omrane','El Omrane Supérieur','El Ouardia','Ettahrir','Ezzouhour','La Goulette','La Marsa','Le Bardo','Le Kram','Medina','Séjoumi','Sidi El Béchir','Sidi Hassine'],
  'أريانة': ['Ariana Ville','Cité Ettadhamen','Kalâat El Andalous','La Soukra','Mnihla','Raoued','Sidi Thabet'],
  'بن عروس': ['Ben Arous','Bou Mhel El Bassatine','El Mourouj','Ezzahra','Fouchana','Hammam Chott','Hammam Lif','Medina Jedida','Mégrine','Mohamedia','Mornag','Radès'],
  'منوبة': ['Borj El Amri','Djedeida','Douar Hicher','El Batan','Manouba','Mornaguia','Oued Ellil','Tebourba'],
  'نابل': ['Béni Khalled','Béni Khiar','Bou Argoub','Dar Châabane El Fehri','El Haouaria','El Mida','Grombalia','Hammamet','Hammam Ghezèze','Kélibia','Korba','Menzel Bouzelfa','Menzel Temime','Nabeul','Soliman','Takelsa'],
  'زغوان': ['Bir Mcherga','El Fahs','Nadhour','Saouaf','Zaghouan','Zriba'],
  'بنزرت': ['Bizerte Nord','Bizerte Sud','El Alia','Ghar El Melh','Ghezala','Joumine','Mateur','Menzel Bourguiba','Menzel Jemil','Ras Jebel','Sejnane','Tinja','Utique','Zarzouna'],
  'باجة': ['Amdoun','Béja Nord','Béja Sud','Goubellat','Medjez El Bab','Nefza','Téboursouk','Testour','Thibar'],
  'جندوبة': ['Aïn Draham','Balta - Bou Aouane','Bou Salem','Fernana','Ghardimaou','Jendouba','Jendouba Nord','Oued Meliz','Tabarka'],
  'الكاف': ['Dahmani','El Ksour','Jérissa','Kalâat Khasba','Kalaat Senan','Kef Est','Kef Ouest','Nebeur','Sakiet Sidi Youssef','Sers','Tajerouine','Touiref'],
  'سليانة': ['Bargou','Bou Arada','El Aroussa','El Krib','Gaâfour','Kesra','Makthar','Rouhia','Sidi Bou Rouis','Siliana Nord','Siliana Sud'],
  'سوسة': ['Akouda','Bouficha','Enfida','Hammam Sousse','Hergla','Kalâa Kebira','Kalâa Seghira','Kondar',"M'saken",'Sidi Bou Ali','Sidi El Hani','Sousse Jawhara','Sousse Médina','Sousse Riadh','Sousse Sidi Abdelhamid','Zaouiet - Ksibet Thrayet'],
  'المنستير': ['Bekalta','Bembla','Beni Hassen','Jemmal','Ksar Hellal','Ksibet El Médiouni','Moknine','Monastir','Ouerdanine','Sahline','Sayada - Lamta - Bouhjar','Téboulba','Zéramdine'],
  'المهدية': ['Bou Merdes','Chebba','Chorbane','El Bradâa','El Jem','Essouassi','Hebira','Ksour Essef','Mahdia','Melloulèche','Ouled Chamekh','Rejiche','Sidi Alouane'],
  'صفاقس': ['Agareb','Bir Ali Ben Khalifa','El Amra','El Hencha','Graïba','Jebiniana','Kerkennah','Mahrès','Menzel Chaker','Sakiet Eddaïer','Sakiet Ezzit','Sfax Ouest','Sfax Sud','Sfax Ville','Skhira','Thyna'],
  'القيروان': ['Aïn Djeloula','Bou Hajla','Chebika','Echrarda','El Alâa','Haffouz','Hajeb el Ayoun','Kairouan Nord','Kairouan Sud','Menzel Mehiri','Nasrallah','Oueslatia','Sbikha'],
  'القصرين': ['El Ayoun','Ezzouhour','Fériana','Foussana','Haïdra','Hassi El Ferid','Jedelienne','Kasserine Nord','Kasserine Sud','Majel Bel Abbès','Sbeïtla','Sbiba','Thala'],
  'سيدي بوزيد': ['Bir El Hafey','Cebbala Ouled Asker','El Hichria','Essaïda','Jilma','Meknassy','Menzel Bouzaiane','Mezzouna','Ouled Haffouz','Regueb','Sidi Ali Ben Aoun','Sidi Bouzid Est','Sidi Bouzid Ouest','Souk Jedid'],
  'قابس': ['Dkhilet Toujane','El Hamma','Gabès Médina','Gabès Ouest','Gabès Sud','Ghannouch','Habib Thameur Bouatouch','Mareth','Matmata','Menzel El Habib','Métouia','Nouvelle Matmata','Oudhref'],
  'مدنين': ['Ben Gardane','Beni Khedache','Djerba Ajim','Djerba Houmt Souk','Djerba Midoun','Médenine Nord','Médenine Sud','Sidi Makhlouf','Zarzis'],
  'تطاوين': ['Beni Mehira','Bir Lahmar','Dehiba','Ghomrassen','Remada','Smâr','Tataouine Nord','Tataouine Sud'],
  'قبلي': ['Douz Nord','Douz Sud','Faouar','Kébili Nord','Kébili Sud','Rjim Maatoug','Souk Lahad'],
  'توزر': ['Degache','El Hamma du Jérid','Hazoua','Nefta','Tamerza','Tozeur'],
  'قفصة': ['Belkhir','El Guettar','El Ksar','Gafsa Nord','Gafsa Sud','Mdhila','Métlaoui','Moularès','Redeyef','Sened','Sidi Aïch','Sidi Boubaker','Zannouch'],
};

function wireZonePickers(govSelectEl, delegSelectEl) {
  govSelectEl.innerHTML = Object.keys(ZONES).map(z => `<option>${z}</option>`).join('');
  function refreshDelegations() {
    const delegs = DELEGATIONS[govSelectEl.value] || [];
    delegSelectEl.innerHTML = delegs.map(d => `<option>${d}</option>`).join('');
  }
  govSelectEl.addEventListener('change', refreshDelegations);
  refreshDelegations();
}
