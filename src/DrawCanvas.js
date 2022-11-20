import { React, useState, useRef, useEffect, useCallback } from "react";
import computeIou from "./GetIou";
import logo from "./mustang.jpg";
import axios from "axios";
import "./DrawCanvas.css";
import { json } from "react-router-dom";

function DrawCanvas() {
  const canvasRef = useRef(null); //프론트 캔버스
  const canvasRef2 = useRef(null); //백그라운드 캔버스

  const [ctx, setCtx] = useState(null); //프론트 캔버스 current
  const [ctx2, setCtx2] = useState(null); //백그라운드 캔버스 current

  const [boxColor, setBoxColor] = useState([]); //annotation color
  const [pos, setPos] = useState([]); //클릭좌표 박스 시작 위치
  const [bBox, setbBox] = useState([]); //데이터의 bbox 좌표
  const [isDraw, setIsDraw] = useState(false); //마우스 클릭 여부
  const [jsonData, setJsonData] = useState(null); //json 객체저장
  const [mode, setMode] = useState(-1); //Iou 검사할 annotation ID
  const [iou, setIou] = useState(0); //저장안된 IOU
  const [storedIou, setStoredIou] = useState([]); //저장된 IOU

  //프론트 캔버스 선언
  const getCanvas = () => {
    const canvas = canvasRef.current;
    canvas.width = jsonData.images[0].width;
    canvas.height = jsonData.images[0].height;
    const context = canvas.getContext("2d");
    setCtx(context);
  };

  //백그라운드 캔버스 선언
  const getBackCanvas = (drawImg, drawBbox) => {
    const canvas = canvasRef2.current;
    canvas.width = jsonData.images[0].width;
    canvas.height = jsonData.images[0].height;
    const context = canvas.getContext("2d");
    drawImg(context);
    context.fillRect(0, 0, 1000, 1000);
    setCtx2(context);
  };

  //jsondata, bbox 정보 저장
  const getJsonData = async () => {
    await axios
      .get(
        "./json_data/labeling_data_4-1/IMG_0005049_umbrella(umbrella)_(4_1).json" //json 데이터 경로 지정? 어떤식으로 api 데이터를 한번에 받을지 모름
      )
      .then((res) => {
        setJsonData(res.data);
        if (res.data.annotations.length <= bBox.length) {
          return;
        }
        res.data.annotations.map(
          (
            item //bbox 좌표 저장
          ) =>
            setbBox((current) => {
              return [...current, item.bbox];
            })
        );
      });
  };

  //background 이미지 그리기
  const drawImg = (context) => {
    if (jsonData) {
      const image = new Image();
      image.src = require("../public/json_data/original_data/" +
        jsonData.images[0].file_name); //이미지 불러오기

      image.onload = () => {
        context.drawImage(
          image,
          0,
          0,
          jsonData.images[0].width,
          jsonData.images[0].height
        );
      };
    }
  };

  //bbox 색상 만들기 및 저장
  const getBoxColor = () => {
    let r = Math.round(Math.random() * 255);
    let g = Math.round(Math.random() * 255);
    let b = Math.round(Math.random() * 255);
    setBoxColor((cur) => [...cur, `rgba(${r},${g},${b},0.5)`]);
  };

  //새로고침시 데이터 불러오기
  useEffect(() => {
    if (jsonData === null && bBox.length === 0) {
      getJsonData();
    }
  }, [jsonData, bBox]);

  //canvas 그리기, storediou 및 boxcolor 값 초기화
  useEffect(() => {
    if (jsonData !== null) {
      getCanvas();
      getBackCanvas(drawImg);
      if (boxColor.length < bBox.length) {
        for (let i = 0; i < bBox.length; i++) {
          getBoxColor();
          setStoredIou((cur) => [...cur, 0]);
        }
      }
    }
  }, [jsonData]);

  useEffect(() => {
    if (jsonData !== null) {
      getCanvas();
      getBackCanvas(drawImg);
    }
  }, []);

  //mode 바뀔 시 IOU는 0으로 초기화
  useEffect(() => setIou(0), [mode]);

  function drawStart(e) {
    //마우스클릭
    console.log(bBox);
    setIsDraw(true);
    setPos([
      e.clientX - canvasRef.current.offsetLeft,
      e.clientY - canvasRef.current.offsetTop,
    ]);
  }

  function drawSquare(e) {
    //마우스 클릭 후 이동
    if (!isDraw) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = "rgba(0,0,250,0.5)";
    ctx.strokeStyle = "blue";
    let currentX = e.clientX - canvasRef.current.offsetLeft;
    let currentY = e.clientY - canvasRef.current.offsetTop;
    ctx.strokeRect(pos[0], pos[1], currentX - pos[0], currentY - pos[1]);
    ctx.fillRect(pos[0], pos[1], currentX - pos[0], currentY - pos[1]);
  }

  function drawEnd(e) {
    //마우스 클릭해제
    setIsDraw(false);
    if (mode !== -1) {
      // iou 구하기
      let currentX = e.clientX - canvasRef.current.offsetLeft;
      let currentY = e.clientY - canvasRef.current.offsetTop;
      const iou = computeIou(
        {
          x: pos[0],
          y: pos[1],
          w: currentX - pos[0],
          h: currentY - pos[1],
        },
        {
          x: bBox[mode][0],
          y: bBox[mode][1],
          w: bBox[mode][2],
          h: bBox[mode][3],
        }
      );
      setIou(iou);
    }
  }

  function getIou(index) {
    if (index !== mode) {
      return 0;
    } else {
      return iou;
    }
  }

  console.log(storedIou);

  return (
    <div>
      {jsonData === null ? (
        <div>Loading...</div>
      ) : (
        <div
          className="container"
          style={{
            display: "flex",
            flexDirection: "column",
            width: jsonData.images[0].width,
            height: jsonData.images[0].height,
          }}
        >
          <canvas className="img" ref={canvasRef2} />
          <canvas
            className="canvas"
            ref={canvasRef}
            onMouseDown={drawStart}
            onMouseUp={drawEnd}
            onMouseMove={drawSquare}
          />
          {bBox.map(
            (
              item,
              index //bbox 표시
            ) => (
              <div
                style={{
                  position: "absolute",
                  backgroundColor: boxColor[index],
                  left: item[0],
                  top: item[1],
                  width: item[2],
                  height: item[3],
                  zIndex: "2",
                }}
              ></div>
            )
          )}
          {jsonData.annotations.map((item, index) => (
            <div //annotation 별 특성 표시
              style={{
                position: "relative",
                fontSize: 30,
                borderStyle: "solid",
                borderColor: boxColor[index],
                width: 400,
                left: jsonData.images[0].width + 100,
                whiteSpace: "pre-line",
              }}
              onClick={() => setMode(index)}
            >
              Annotations ID:{item.id}
              {"\n"}Object Class:
              {"\n"}현재 IOU: {getIou(index)}
              {"\n"}저장된 IOU:{storedIou[index]}
              {"\n"}
              <input
                type="button"
                value="IOU 저장"
                onClick={() => {
                  let copy = storedIou;
                  copy[index] = iou;
                  setStoredIou(copy);
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

export default DrawCanvas;
