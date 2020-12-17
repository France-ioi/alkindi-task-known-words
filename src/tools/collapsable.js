import React, {useState} from 'react';
import {Collapse} from 'react-bootstrap';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export default React.memo(function Collapsable (props) {
  const [open, setOpen] = useState(true);
  const {title, children} = props;


  const newTitle = React.cloneElement(title, {
    onClick: () => setOpen(!open),
    children: [
      <FontAwesomeIcon key="icon" className="icon-collapse" icon={open ? 'chevron-up' : 'chevron-down'} />,
      " ",
      title.props.children
    ]
  });


  return (
    <>
      {newTitle}
      <Collapse in={open}>
        <div>
          {children}
        </div>
      </Collapse>
    </>
  );
});
