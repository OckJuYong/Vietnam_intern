import React, { useEffect, useRef, useState } from 'react';
import '@arcgis/core/assets/esri/themes/light/main.css';
import { loadModules } from 'esri-loader';
import axios from 'axios';

import CustomSelect from './CustomSelect';

import "./App.css";

// 이미지 파일 임포트
import DROUGHT from './conponent/img/가뭄.png';
import TYPNOON from './conponent/img/산불.png';
import TSUNAMI from './conponent/img/쓰나미.png';
import LANDSLIDE from './conponent/img/산사태.png';
import LANDSFIRE from './conponent/img/홍수.png';
import WILDFILE from './conponent/img/지진.png';
import TYPHOON from './conponent/img/태풍.png';

import CH_DROUGHT from './conponent/img2/가뭄.png';
import CH_TYPNOON from './conponent/img2/산불.png';
import CH_TSUNAMI from './conponent/img2/쓰나미.png';
import CH_LANDSLIDE from './conponent/img2/산사태.png';
import CH_LANDSFIRE from './conponent/img2/홍수.png';
import CH_WILDFILE from './conponent/img2/지진.png';
import CH_TYPHOON from './conponent/img2/태풍.png';

import Img1 from "./conponent/img/기본이미지.png";
import Img2 from "./conponent/img/위성이미지.png";
import Img3 from './conponent/img/하이브리드 이미지.png';
import Img4 from './conponent/img/지형이미지.png';

const App = () => {
  const viewDivRef = useRef(null);
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);
  const disasterModalRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [coordinates, setCoordinates] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [basemap, setBasemap] = useState("streets");
  const [showModal, setShowModal] = useState(false);
  const [showDisasterModal, setShowDisasterModal] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState(LANDSFIRE);
  const [disasterType, setDisasterType] = useState('flood-risk'); // 초기 값은 홍수
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  
  const [day, setDay] = useState(8);
  const [riskAreas, setRiskAreas] = useState({ high_risk_areas: [], medium_risk_areas: [], low_risk_areas: [] });

  const main_address = "https://apis.wemap.asia";
  const key_address = "YZkGTFFioePZWDhTolBEFiRFJHDbanHW";

  const [Img_type, setImg_type] = useState("기본이미지");

  const imgTypes = [
    { type: "streets", label: "기본이미지", img: Img1 },
    { type: "satellite", label: "위성이미지", img: Img2 },
    { type: "hybrid", label: "하이브리드", img: Img3 },
    { type: "terrain", label: "지형이미지", img: Img4 }
  ];

  const disasterOptions = [
    { name: "홍수", img: LANDSFIRE, modalImg: CH_LANDSFIRE, type: 'flood-risk' },
    { name: "가뭄", img: DROUGHT, modalImg: CH_DROUGHT, type: 'drought-risk' },
    { name: "산불", img: TYPNOON, modalImg: CH_TYPNOON, type: 'fire-risk' },
  ];

  const selectImgType = (type, label) => {
    setBasemap(type);
    setImg_type(label);
    setShowModal(false);
  };

  const handleDisasterClick = (modalImg, img, type) => {
    setSelectedDisaster(img);
    setDisasterType(type); // 선택된 재해 유형에 따라 URL을 변경
    setShowDisasterModal(false);
  };

  const fetchRiskAreas = async (month) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://172.20.10.4:5003/api/${disasterType}/${month}/`);
      console.log("Fetched risk areas:", response.data);
      setRiskAreas(response.data);
    } catch (error) {
      console.error('Error fetching risk areas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingSpinner = () => (
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setOrigin([longitude, latitude]);
        setCoordinates([104.96840217998864, 11.159358011794003]);

        fetchRiskAreas(day);
      }, () => {
        setCoordinates([21.0285, 105.8542]);
      });
    } else {
      setCoordinates([21.0285, 105.8542]);
    }
  }, []);

  useEffect(() => {
    fetchRiskAreas(day);
  }, [day, disasterType]);

  useEffect(() => {
    if (coordinates) {
      initializeMap(coordinates);
    }
  }, [coordinates, basemap, riskAreas]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false);
      }
      if (disasterModalRef.current && !disasterModalRef.current.contains(event.target)) {
        setShowDisasterModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initializeMap = async (coordinates) => {
    const [Map, MapView, Graphic, GraphicsLayer, Polygon, geometryEngine] = await loadModules([
      'esri/Map',
      'esri/views/MapView',
      'esri/Graphic',
      'esri/layers/GraphicsLayer',
      'esri/geometry/Polygon',
      'esri/geometry/geometryEngine'
    ]);
  
    const map = new Map({
      basemap: basemap
    });
  
    const view = new MapView({
      container: viewDivRef.current,
      map: map,
      center: coordinates,
      zoom: 8
    });
  
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);
  
    addMarker(graphicsLayer, coordinates, 'blue');
  
    // 홍수일 때와 다른 재해일 때 색상을 구분
    const isFlood = selectedDisaster === LANDSFIRE;
  
    const highRiskColor = isFlood ? [0, 255, 0, 0.5] : [255, 0, 0, 0.5]; // 홍수일 때 반전된 색상
    const lowRiskColor = isFlood ? [255, 0, 0, 0.5] : [0, 255, 0, 0.5];  // 홍수일 때 반전된 색상
    const mediumRiskColor = [255, 165, 0, 0.5]; // 중위험 색상은 동일
  
    const mergePolygons = (areas, color) => {
      if (areas && areas.length > 0) {
        areas.forEach(areaGroup => {
          if (areaGroup && areaGroup.length > 0) {
            const polygon = new Polygon({
              rings: [areaGroup]
            });
  
            const fillSymbol = {
              type: 'simple-fill',
              color: color,
              outline: {
                color: [255, 255, 255],
                width: 1
              }
            };
  
            const polygonGraphic = new Graphic({
              geometry: polygon,
              symbol: fillSymbol
            });
  
            graphicsLayer.add(polygonGraphic);
          }
        });
      }
    };
  
    // 각 위험도에 맞는 색상을 적용
    mergePolygons(riskAreas.high_risk_areas, highRiskColor);
    mergePolygons(riskAreas.medium_risk_areas, mediumRiskColor);
    mergePolygons(riskAreas.low_risk_areas, lowRiskColor);
  };
  

  const addMarker = (graphicsLayer, coordinates, color) => {
    const point = {
      type: 'point',
      longitude: coordinates[0],
      latitude: coordinates[1]
    };

    const markerSymbol = {
      type: 'simple-marker',
      color: color,
      outline: {
        color: 'white',
        width: 1
      }
    };

    loadModules(['esri/Graphic']).then(([Graphic]) => {
      const pointGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol
      });

      graphicsLayer.add(pointGraphic);
    });
  };

  const fetchAddress = async () => {
    try {
      const response = await axios.get(`${main_address}/geocode-1/search?text=${searchText}&key=${key_address}`);
      if (response.data.features && response.data.features.length > 0) {
        const coordinates = response.data.features[0].geometry.coordinates;
        setCoordinates(coordinates);
      } else {
        console.error('No features found in response.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAutocomplete = async (query) => {
    try {
      const response = await axios.get(`${main_address}/geocode-1/autocomplete?text=${query}&key=${key_address}`);
      if (response.data.features) {
        setAutocompleteSuggestions(response.data.features);
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error('Error fetching autocomplete data:', error);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchText(suggestion.properties.label);
    setAutocompleteSuggestions([]);
    setShowAutocomplete(false);
    fetchAddress();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAddress();
  };

  const handleMonthChange = (e) => {
    const selectedMonth = parseInt(e.target.value, 10);
    setDay(selectedMonth);
  };

  return (
    <div className="app-container">
      {isLoading && <LoadingSpinner />}
      <div ref={viewDivRef} className="map-container"></div>
  
      <div className="search_container">
        <form onSubmit={handleSearchSubmit} className="search-form" ref={searchInputRef}>
          <>
            <input 
              className='search-input' 
              value={searchText} 
              onChange={(e) => {
                setSearchText(e.target.value);
                fetchAutocomplete(e.target.value); 
              }}
              onFocus={() => fetchAutocomplete(searchText)} 
              placeholder="Search for a location" 
            />
            <button type="submit" className="search-button">검색</button>
          </>
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <ul className="search_modal autocomplete-suggestions">
              {autocompleteSuggestions.map((suggestion, index) => (
                <li 
                  key={index} 
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.properties.label}
                </li>
              ))}
            </ul>
          )}
        </form>
        
        <div className='search_sub_container'>
        <CustomSelect value={day} onChange={handleMonthChange} />
          <div onClick={() => setShowModal(!showModal)} className="basemap-selector">
            <div className="basemap-slider">
              {imgTypes.map((imgType, index) => (
                <div 
                  key={index} 
                  className={`basemap-option ${Img_type === imgType.label ? 'selected' : ''}`}
                >
                  <img src={imgType.img} alt={imgType.label} className='img_sel'/>
                </div>
              ))}
            </div>
          </div>
        <img src={selectedDisaster} alt="Selected Disaster" className='weather_choice' onClick={() => setShowDisasterModal(!showDisasterModal)}/>

        </div>

      </div>
  
      {showModal && (
        <div ref={modalRef} className="modal-content autocomplete-suggestions">
          <ul className='ul_im'>
            {imgTypes.map((imgType, index) => (
              <li key={index} onClick={() => selectImgType(imgType.type, imgType.label)}>
                {imgType.label}
                <img src={imgType.img} alt={imgType.label} className='img_sel_2'/>
              </li>
            ))}
          </ul>
        </div>
      )}
  
      {showDisasterModal && (
        <div ref={disasterModalRef} className="modal-content2 autocomplete-suggestions">
        <div className="disaster-grid">
          {disasterOptions.map((disaster, index) => (
            <div 
              key={index} 
              className={`disaster-option ${selectedDisaster === disaster.img ? 'selected-disaster' : ''}`}
              onClick={() => handleDisasterClick(disaster.modalImg, disaster.img, disaster.type)}
            >
              <img src={disaster.modalImg} alt={disaster.name} className="disaster-img"/>
              <span>{disaster.name}</span>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};

export default App;
