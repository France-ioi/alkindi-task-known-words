import React from 'react';

export default class SubstitutionView extends React.PureComponent {
  render () {
    const {type, count, unknown, bordered, draggable} = this.props;

    return (
      <span className={`substitution-view ${bordered ? 'substitution-view-bordered': ''}`}>
        {draggable && <svg x="0px" y="0px" width="10px" height="20px" viewBox="0 0 20 40" version="1.1" xmlns="http://www.w3.org/2000/svg">>
          <circle fill="#D8D8D8" opacity="0.5" cx="10" cy="12" r="3"></circle>
          <circle fill="#D8D8D8" opacity="0.5" cx="10" cy="20" r="3"></circle>
          <circle fill="#D8D8D8" opacity="0.5" cx="10" cy="28" r="3"></circle>
        </svg>}
        {count && <div className="substitution-view-count">{count}</div>}
        {unknown && <div className="substitution-view-count">?</div>}
        <span className={"substitution-view-element"}>
          <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
            {type === 0 && <rect x="1" y="1" width="14" height="14" stroke="black" fill="#4A90E2" strokeWidth={1}/>}
            {type === 1 && <circle cx="8" cy="8" r="7" stroke="black" fill="#F23459" strokeWidth={1}/>}
            {type === 7 && <polygon points="8,0,9.76335575687742,5.572949016875158,15.60845213036123,5.52786404500042,10.853169548885461,8.927050983124841,12.702282018339787,14.47213595499958,8,11,3.297717981660216,14.47213595499958,5.146830451114539,8.927050983124843,0.39154786963877086,5.527864045000422,6.23664424312258,5.5729490168751585"
                                    stroke="black" fill="#88BB88" strokeWidth={1}
            />}
            {type === 6 && <ellipse cx="8" cy="8" rx="7" ry="4" stroke="black" fill="#f56ef3" strokeWidth={1}/>}
            {type === 2 && <path d="
M 8 1
L 1 6
L 4 14
L 12 14
L 15 6
L 8 1" stroke="black" fill="#07E3E4" strokeWidth={1}/>}
            {type === 3 && <path d="M 1,15 L 8,1 L 15,15 z" stroke="black" fill="#FDC804" strokeWidth={1}/>}
            {type === 4 && <ellipse cx="8" cy="8" rx="4" ry="7" stroke="black" fill="#b37620" strokeWidth={1}/>}
            {type === 5 && <path d="M 1,1 L 8,15 L 15,1 z" stroke="black" fill="#9b32a8" strokeWidth={1}/>}
          </svg>
        </span>
      </span>
    );
  }
}
