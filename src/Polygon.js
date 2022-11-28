import { React, useState, useRef, useEffect } from "react";
import axios from "axios";
import { polygon as poly } from "polygon-tools";

function Polygon() {
  const [ctx, setCtx] = useState(null); //background canvas 2d context
  const [ctx2, setCtx2] = useState(); //front canvas ..
  const [jsonData, setJsonData] = useState(null); //json 객체저장
  const [polygon, setPolygon] = useState([]); //polygon 좌표들 [[x,y], ...]

  const [boxColor, setBoxColor] = useState([]); //annotation color
  const [pos, setPos] = useState([]); //점 좌표
  const [isDraw, setIsDraw] = useState(false); //첫 마우스(시작점) 클릭 여부
  const [iou, setIou] = useState([]); //저장안된 IOU
  const [mode, setMode] = useState(-1); //선택한 annotation -1 일시 암것도안함
  const [storedIou, setStoredIou] = useState([]); //저장한 IOU
  const [storedPos, setStoredPos] = useState([]); //저장한 pos
  const canvasRef = useRef(null);
  const canvas2Ref = useRef(null);

  //배열 2개로 나눠서 저장하기 (x,y)
  const chunk = (arr) => {
    let i,
      j,
      temparray = [],
      chunk = 2;
    for (i = 0, j = arr.length; i < j; i += chunk) {
      temparray.push(arr.slice(i, i + chunk));
    }
    return temparray;
  };

  //bbox 색상 만들기 및 저장
  const getBoxColor = () => {
    let r = Math.round(Math.random() * 255);
    let g = Math.round(Math.random() * 255);
    let b = Math.round(Math.random() * 255);
    setBoxColor((cur) => [...cur, `rgba(${r},${g},${b},1)`]);
  };

  //jsondata, bbox 정보 저장
  const getJsonData = async () => {
    await axios
      .get(
        "../json_data/labeling_data_4-2/IMG_0001488_bird(bird)_(4_2).json" //json 데이터 경로 지정? 어떤식으로 api 데이터를 한번에 받을지 모름
      )
      .then((res) => {
        setJsonData(res.data);
        if (res.data.annotations.length <= polygon.length) {
          return;
        }
        res.data.annotations.map(
          (
            item //bbox 좌표 저장
          ) => {
            const data = chunk(item.segmentation[0]);
            return setPolygon((current) => {
              return [...current, data];
            });
          }
        );
      });
  };

  //polygon 그리기 준비
  const setPath = (index) => {
    if (isDraw) {
      return;
    }
    setMode(index);
    let copy = iou;
    for (let i = 0; i < copy.length; i++) {
      copy[i] = 0;
    }
    setIou(copy);
    ctx2.clearRect(0, 0, jsonData.images[0].width, jsonData.images[0].height);
    setPos([]);
  };

  //iou 및 좌표 저장
  const storeIou = (index) => {
    let copy = storedIou;
    let copyPos = storedPos;
    copy[index] = iou[index];
    copyPos[index] = pos;
    setStoredIou(copy);
    setStoredPos(copyPos);
  };

  //polygon 그리기종료
  const endPath = (index) => {
    if (mode !== index) {
      return;
    }
    ctx2.closePath();
    ctx2.stroke();
    setIsDraw(false);
    setMode(-1);
    let copy = iou;
    copy[index] = getIou(polygon[index], pos);
    setIou(copy);
  };

  //polygon 면적 구하기
  const getPolygonSize = (data) => {
    var area = poly.area(data);
    if (area < 0) {
      area = -area;
    }
    return area;
  };

  //polygon iou 구하기 , 면적(polygon, 직접찍은 polygon, 겹친 iou)
  const getIou = (p, c) => {
    const a = getPolygonSize(p);
    const b = getPolygonSize(c);
    let inter = poly.intersection(p, c);
    if (inter.length === 0) return 0;
    inter = getPolygonSize(inter[0]);
    const iou = inter / (a + b - inter);
    return iou;
  };

  const drawPolygon = () => {
    if (ctx !== null) {
      for (var i = 0; i < polygon.length; i++) {
        ctx.strokeStyle = boxColor[i];
        ctx.fillStyle = boxColor[i];
        ctx.beginPath();
        ctx.moveTo(polygon[i][0][0], polygon[i][0][1]);
        polygon[i].map((item) => ctx.lineTo(item[0], item[1]));
        ctx.closePath();
        ctx.stroke();
      }
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////////////// (변수선언끝)

  //jsonData 불러오기 및 canvas 초기화

  useEffect(() => {
    getJsonData();
  }, []);

  useEffect(() => {
    if (jsonData !== null) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.lineWidth = 5;
      setCtx(context);
      const canvas2 = canvas2Ref.current;
      const context2 = canvas2.getContext("2d");
      context2.lineWidth = 5;
      setCtx2(context2);
    }
  }, [jsonData]);

  //storediou 및 boxcolor 값 초기화
  useEffect(() => {
    if (boxColor.length < polygon.length) {
      for (let i = 0; i < polygon.length; i++) {
        getBoxColor();
        setStoredIou((cur) => [...cur, 0]);
        setIou((cur) => [...cur, 0]);
        setStoredPos((cur) => [...cur, 0]);
      }
    }
  });

  //json polygon 그리기
  useEffect(() => {
    if (jsonData !== null) {
      drawPolygon();
    }
  }, [boxColor, jsonData]);

  //마우스 클릭시 좌표 저장 및  폴리곤 그리기
  const drawStart = (e) => {
    if (mode === -1) return;
    let currentX = e.clientX - canvas2Ref.current.offsetLeft;
    let currentY = e.clientY - canvas2Ref.current.offsetTop;
    ctx2.strokeStyle = "blue";
    if (!isDraw) {
      ctx2.moveTo(currentX, currentY);
      ctx2.beginPath();
      ctx2.moveTo(currentX, currentY);
      setPos((cur) => [...cur, [currentX, currentY]]);
      setIsDraw(true);
    } else {
      setPos((cur) => [...cur, [currentX, currentY]]);
      ctx2.lineTo(currentX, currentY);
      ctx2.stroke();
    }
  };

  return (
    <div>
      {jsonData === null ? (
        <div>loading...</div>
      ) : (
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: jsonData.images[0].width,
            height: jsonData.images[0].height,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
            width={jsonData.images[0].width}
            height={jsonData.images[0].height}
          />
          <canvas
            ref={canvas2Ref}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 3 }}
            width={jsonData.images[0].width}
            height={jsonData.images[0].height}
            onMouseDown={drawStart}
          />
          <img
            src={require("../public/json_data/original_data/" +
              jsonData.images[0].file_name)}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
          />

          {jsonData.annotations.map((item, index) => (
            <div //annotation 별 특성 표시
              style={{
                position: "relative",
                fontSize: 30,
                borderStyle: "solid",
                borderColor: boxColor[index],
                width: 450,
                left: jsonData.images[0].width,
                whiteSpace: "pre-line",
              }}
              // onClick={() => setMode(index)}
            >
              Annotations ID:{item.id}
              {"\n"}Object Class:
              {"\n"}현재 IOU: {iou[index]}
              {"\n"}저장된 IOU:{storedIou[index]}
              {"\n"}
              <input
                type="button"
                value="검사 시작"
                onClick={() => {
                  setPath(index);
                }}
                style={{ fontSize: 30 }}
              />
              <input
                type="button"
                value="검사 종료"
                onClick={() => {
                  endPath(index);
                }}
                style={{ fontSize: 30 }}
              />
              <input
                type="button"
                value="저장"
                onClick={() => {
                  storeIou(index);
                }}
                style={{ fontSize: 30 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Polygon;
