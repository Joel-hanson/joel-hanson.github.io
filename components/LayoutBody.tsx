import * as React from 'react';
import { Row } from 'react-grid-system';

const LayoutBody: React.FunctionComponent = ({ children }) => (
    <Row className="layout-body">
        {children}
    </Row>
)

export default LayoutBody;