import '@patternfly/patternfly/patternfly.css';
import '@patternfly/patternfly/utilities/Accessibility/accessibility.css';
import '@patternfly/patternfly/utilities/Sizing/sizing.css';
import '@patternfly/patternfly/utilities/Spacing/spacing.css';
import '@patternfly/patternfly/utilities/Display/display.css';
import '@patternfly/patternfly/utilities/Flex/flex.css';
import '@patternfly/patternfly/utilities/BackgroundColor/BackgroundColor.css';
import '@cos-ui/app/dist/cos-ui-app.css';
import '@cos-ui/creation-wizard/dist/cos-ui-creation-wizard.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DemoApp } from '@cos-ui/app';

ReactDOM.render(<DemoApp />, document.getElementById('root'));