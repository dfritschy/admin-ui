import * as browser from './browser.helper';
import * as contentType from './content.type.helper';
import * as cookies from './cookies.helper';
import * as formError from './form.error.helper';
import * as formValidation from './form.validation.helper';
import * as highlight from './highlight.helper';
import * as icon from './icon.helper';
import * as location from './location.helper';
import * as middleEllipsis from './middle.ellipsis';
import * as modal from './modal.helper';
import * as notification from './notification.helper';
import * as objectInstances from './object.instances';
import * as pagination from './pagination.helper';
import * as request from './request.helper';
import * as system from './system.helper';
import * as table from './table.helper';
import * as tagViewSelect from './tag.view.select.helper';
import * as text from './text.helper';
import * as timezone from './timezone.helper';
import * as tooltips from './tooltips.helper';
import * as user from './user.helper';

(function (ibexa) {
    ibexa.addConfig('helpers.browser', browser);
    ibexa.addConfig('helpers.contentType', contentType);
    ibexa.addConfig('helpers.cookies', cookies);
    ibexa.addConfig('helpers.formError', formError);
    ibexa.addConfig('helpers.formValidation', formValidation);
    ibexa.addConfig('helpers.highlight', highlight);
    ibexa.addConfig('helpers.icon', icon);
    ibexa.addConfig('helpers.location', location);
    ibexa.addConfig('helpers.ellipsis.middle', middleEllipsis);
    ibexa.addConfig('helpers.modal', modal);
    ibexa.addConfig('helpers.notification', notification);
    ibexa.addConfig('helpers.objectInstances', objectInstances);
    ibexa.addConfig('helpers.pagination', pagination);
    ibexa.addConfig('helpers.request', request);
    ibexa.addConfig('helpers.system', system);
    ibexa.addConfig('helpers.table', table);
    ibexa.addConfig('helpers.tagViewSelect', tagViewSelect);
    ibexa.addConfig('helpers.text', text);
    ibexa.addConfig('helpers.timezone', timezone);
    ibexa.addConfig('helpers.tooltips', tooltips);
    ibexa.addConfig('helpers.user', user);
})(window.ibexa);
