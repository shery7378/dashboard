import i18n from '@i18n';
import en from './en';
import tr from './tr';
import ar from './ar';
import es from './es';
import fr from './fr';
import de from './de';
import it from './it';
import pt from './pt';
import zh from './zh';

i18n.addResourceBundle('en', 'payouts', en);
i18n.addResourceBundle('tr', 'payouts', tr);
i18n.addResourceBundle('ar', 'payouts', ar);
i18n.addResourceBundle('es', 'payouts', es);
i18n.addResourceBundle('fr', 'payouts', fr);
i18n.addResourceBundle('de', 'payouts', de);
i18n.addResourceBundle('it', 'payouts', it);
i18n.addResourceBundle('pt', 'payouts', pt);
i18n.addResourceBundle('zh', 'payouts', zh);

export default { en, tr, ar, es, fr, de, it, pt, zh };

