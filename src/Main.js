import {Link} from 'react-router-dom';

function Main(){
  return(
    <div>
      <Link to="data/4-1"><div style={{fontSize:100 }}>4-1</div></Link>
      <Link to="data/4-2"><div style={{fontSize:100 }}>4-2</div></Link>
    </div>
  )
}

export default Main;