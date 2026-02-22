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

i18n.addResourceBundle('en', 'products', en);
i18n.addResourceBundle('tr', 'products', tr);
i18n.addResourceBundle('ar', 'products', ar);
i18n.addResourceBundle('es', 'products', es);
i18n.addResourceBundle('fr', 'products', fr);
i18n.addResourceBundle('de', 'products', de);
i18n.addResourceBundle('it', 'products', it);
i18n.addResourceBundle('pt', 'products', pt);
i18n.addResourceBundle('zh', 'products', zh);

export default { en, tr, ar, es, fr, de, it, pt, zh };
