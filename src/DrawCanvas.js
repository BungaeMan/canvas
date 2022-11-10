import { React, useState, useRef, useEffect } from "react";
import Iou from "./Iou";
import "./DrawCanvas.css";

let arrIou = [];

function DrawCanvas() {
  const drawRef1 = useRef();

  const [drawCtx1, setDrawCtx1] = useState();

  const [pos, setPos] = useState([]);
  const [isDraw, setIsDraw] = useState(false);
  const [boxInfo, setBoxInfo] = useState([]);
  const [mode, setMode] = useState(0);

  useEffect(() => {
    const drawCanvas1 = drawRef1.current;
    setDrawCtx1(drawCanvas1.getContext("2d"));
  }, []);

  const drawStart = (e) => {
    setIsDraw(true);
    setPos([
      e.clientX - drawRef1.current.offsetLeft,
      e.clientY - drawRef1.current.offsetTop,
    ]);
  };

  const drawSquare = (e) => {
    if (!isDraw) return;
    setIsDraw(false);

    let currentX = e.clientX - drawRef1.current.offsetLeft;
    let currentY = e.clientY - drawRef1.current.offsetTop;

    const box = {
      id: boxInfo.length,
      x: pos[0],
      y: pos[1],
      w: currentX - pos[0],
      h: currentY - pos[1],
      iou: 0,
    };

    if (mode === 0) {
      drawCtx1.strokeStyle = "blue";
      drawCtx1.strokeRect(pos[0], pos[1], currentX - pos[0], currentY - pos[1]);

      setBoxInfo([...boxInfo, box]);
    } else {
      drawCtx1.strokeStyle = "yellow";
      drawCtx1.strokeRect(pos[0], pos[1], currentX - pos[0], currentY - pos[1]);
      const size = Iou(boxInfo[mode - 1], box);
      arrIou[mode - 1] = size;
      console.log(boxInfo);

      setMode(0);
    }
  };
  const modeChange = (e) => {
    setMode(Number(e.target.className) + 1);
    console.log(mode);
  };

  return (
    <div className="container">
      <canvas
        className="canvas"
        ref={drawRef1}
        width={1000}
        height={1000}
        onMouseDown={drawStart}
        onMouseUp={drawSquare}
      />
      <ol className="list">
        {boxInfo.map((item) => {
          return (
            <li>
              IOU: {arrIou[item.id]}
              <button className={item.id} onClick={modeChange}>
                Layering
              </button>
            </li>
          );
        })}
      </ol>
      ;
    </div>
  );
}

export default DrawCanvas;
