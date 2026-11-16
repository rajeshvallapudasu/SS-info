const { useState, useEffect, useRef } = React;

function App() {
    const [substationData, setSubstationData] = useState(null);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 1024 : false);
    const [drawingModal, setDrawingModal] = useState({ isOpen: false, feeder: 'Substation Overview', type: 'C&R Panel' });
    const scrollContainerRef = useRef(null);

    const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbyczowAg-w1ZDErilMq27LP6XN6Es7cmGIeiIC3Zvl4l43i5nU54186Ism9BeqtC12vRg/exec";

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (GOOGLE_SHEETS_API_URL) {
            // Fast loading: Check Local Cache instantly
            const cachedData = localStorage.getItem('substationDataCache');
            if (cachedData) {
                try {
                    setSubstationData(JSON.parse(cachedData));
                    setLoading(false); // Hide loading screen instantly
                } catch (e) { console.error(e); }
            }

            // Fetch live layout updates in the background
            fetch(GOOGLE_SHEETS_API_URL)
                .then(res => res.json())
                .then(res => {
                    if (res.status === 'success') {
                        setSubstationData(res.data);
                        localStorage.setItem('substationDataCache', JSON.stringify(res.data));
                        setLoading(false);
                    } else {
                        if (!cachedData) loadFallbackData();
                    }
                })
                .catch(err => {
                    if (!cachedData) loadFallbackData();
                });
        } else {
            loadFallbackData();
        }
    }, []);

    const loadFallbackData = () => {
        if (window.SUBSTATION_DATA_TEMPLATE) {
            setSubstationData(window.SUBSTATION_DATA_TEMPLATE);
        }
        setLoading(false);
    };

    const refreshLayout = () => {
        setLoading(true);
        fetch(GOOGLE_SHEETS_API_URL)
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success') {
                    setSubstationData(res.data);
                    localStorage.setItem('substationDataCache', JSON.stringify(res.data));
                } else {
                    alert('Failed to fetch latest data. Loading fallback...');
                    loadFallbackData();
                }
                setLoading(false);
            })
            .catch(err => {
                alert('Network error. Loading fallback...');
                loadFallbackData();
            });
    };

    const handleEquipmentClick = (equipment, type) => {
        if (!equipment) return;
        setSelectedEquipment({ ...equipment, __type: type });
    };

    const toggleFullScreen = () => {
        const elem = document.getElementById("sld-fullscreen-wrapper");
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(e => console.error(e));
        } else {
            document.exitFullscreen();
        }
    };

    const zoomIn = () => {
        setZoomLevel(prev => {
            if (prev === 'fit') return 1.25;
            return Math.min(2.5, Number((prev + 0.25).toFixed(2)));
        });
    };

    const zoomOut = () => {
        setZoomLevel(prev => {
            if (prev === 'fit') return 0.75;
            return Math.max(0.5, Number((prev - 0.25).toFixed(2)));
        });
    };

    const zoomFit = () => setZoomLevel('fit');
    const zoomReset = () => setZoomLevel(1);

    const handleQuickSelect = (val) => {
        if (!val || !substationData) return;
        const [category, id] = val.split(':');
        let found = null;
        let typeName = "Equipment";

        if (category === '220f') {
            found = substationData.feeders220kV?.find(f => f.id === id);
            typeName = "220kV Feeder";
        } else if (category === '132f') {
            found = substationData.feeders132kV?.find(f => f.id === id);
            typeName = "132kV Feeder";
        } else if (category === '33f') {
            found = substationData.feeders33kV?.find(f => f.id === id);
            typeName = "33kV Feeder";
        } else if (category === 'ptr220') {
            const list = substationData.ptrs220to132 || substationData.ptrs || [];
            found = list.find(p => p.id === id);
            typeName = "PTR 220/132kV";
        } else if (category === 'ptr132') {
            const list = substationData.ptrs132to33 || substationData.ptrs || [];
            found = list.find(p => p.id === id);
            typeName = "PTR 132/33kV";
        }

        if (found) {
            handleEquipmentClick(found, typeName);
            setTimeout(() => {
                const el = document.getElementById(`eq-${id}`);
                if (el && scrollContainerRef.current) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
            }, 100);
        }
    };

    if (loading) {
        return <div className="container" style={{ textAlign: "center", paddingTop: "5rem" }}><h2>Loading Substation Layout...</h2></div>;
    }
    if (!substationData) {
        return <div className="container">Error: No Data Available</div>;
    }

    const extraDetails = Object.keys(substationData).filter(key => {
        return typeof substationData[key] !== 'object' && !['id', 'name', 'voltage'].includes(key);
    });

    return (
        <div className="container" style={{ maxWidth: '100%', padding: isMobile ? '0.5rem' : '1rem' }}>
            <div className="header" style={{ padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1rem' }}>
                <div className="header-content">
                    <div className="header-title" style={{ flexWrap: 'wrap' }}>
                        <div className="header-icon" style={{ fontSize: isMobile ? '2.2rem' : '3rem' }}>⚡</div>
                        <div>
                            <h1 style={{ fontSize: isMobile ? '1.4rem' : '2.2rem' }}>{substationData.name}</h1>
                            <div className="header-subtitle" style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', color: '#00d4ff', marginBottom: extraDetails.length > 0 ? '0.5rem' : '0' }}>
                                Dynamic Single Line Diagram | {substationData.voltage}
                            </div>
                            {extraDetails.length > 0 && (
                                <div className="extra-details" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                                    {extraDetails.map(key => {
                                        const val = substationData[key];
                                        const isLink = typeof val === 'string' && val.startsWith('http');
                                        return (
                                            <span key={key} style={{ background: 'rgba(0,212,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', color: '#e2e8f0', border: '1px solid rgba(0,212,255,0.2)' }}>
                                                <strong style={{ color: '#00d4ff', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
                                                {isLink ? <a href={val} target="_blank" rel="noopener noreferrer" style={{color: '#fff', textDecoration: 'underline'}}>View Link</a> : val}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="header-actions">
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <a href="/towers" className="control-btn" style={{ fontSize: '0.9rem', padding: '0.5rem 0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: '#ffd600', color: '#ffd600' }}>🗼 Tower Locations</a>
                            <button className="control-btn" onClick={() => setDrawingModal({ isOpen: true, feeder: '220KV Damercherla-1', type: 'C&R Panel' })} style={{ fontSize: '0.9rem', padding: '0.5rem 0.9rem', borderColor: '#a855f7', color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>📐 Drawings</button>
                            <button className="control-btn" onClick={() => handleEquipmentClick({ __data: substationData.dcSystem || [] }, "DC System")} style={{ fontSize: '0.9rem', padding: '0.5rem 0.9rem', borderColor: '#00d4ff', color: '#00d4ff' }}>🔋 DC System</button>
                            <button className="control-btn" onClick={() => handleEquipmentClick({ __data: substationData.staffDetails || [] }, "Staff Details")} style={{ fontSize: '0.9rem', padding: '0.5rem 0.9rem', borderColor: '#a855f7', color: '#a855f7' }}>👥 Staff</button>
                            <button className="control-btn" onClick={refreshLayout} style={{ fontSize: '0.9rem', padding: '0.5rem 0.9rem' }}>🔄 Refresh</button>
                            <button className="control-btn" onClick={toggleFullScreen} style={{ fontSize: '0.9rem', padding: '0.5rem 0.9rem' }}>🔲 Full</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-layout">
                <div id="sld-fullscreen-wrapper" className="diagram-area" style={{ padding: 0 }}>
                    {/* Diagram Controls Toolbar */}
                    <div className="diagram-toolbar">
                        <div className="diagram-controls-group">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>SLD Zoom:</span>
                            <button className="zoom-btn" onClick={zoomIn} title="Zoom In">➕ In</button>
                            <button className="zoom-btn" onClick={zoomOut} title="Zoom Out">➖ Out</button>
                            <button className={`zoom-btn ${zoomLevel === 'fit' ? 'active' : ''}`} onClick={zoomFit} title="Fit Entire Diagram to Screen">📐 Fit</button>
                            <button className={`zoom-btn ${zoomLevel === 1 ? 'active' : ''}`} onClick={zoomReset} title="Reset to 100% Crisp View">↺ 100%</button>
                            {zoomLevel !== 'fit' && (
                                <span style={{ fontSize: '0.8rem', color: '#00d4ff', fontWeight: '600' }}>{Math.round(zoomLevel * 100)}%</span>
                            )}
                        </div>

                        <div className="diagram-controls-group" style={{ flex: '1 1 auto', justifyContent: 'flex-end' }}>
                            {isMobile && (
                                <span className="orientation-hint">📱 Swipe to pan</span>
                            )}
                            <select className="mobile-feeder-select" onChange={e => handleQuickSelect(e.target.value)} defaultValue="">
                                <option value="" disabled>⚡ Jump to Feeder / PTR...</option>
                                <optgroup label="220KV Feeders">
                                    {substationData.feeders220kV?.map(f => (
                                        <option key={f.id} value={`220f:${f.id}`}>{f.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="220/132KV PTRs">
                                    {(substationData.ptrs220to132 || substationData.ptrs?.filter(p => p.voltageRatio?.includes("220")) || []).map(p => (
                                        <option key={p.id} value={`ptr220:${p.id}`}>{p.name} ({p.capacity})</option>
                                    ))}
                                </optgroup>
                                <optgroup label="132KV Feeders">
                                    {substationData.feeders132kV?.map(f => (
                                        <option key={f.id} value={`132f:${f.id}`}>{f.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="132/33KV PTRs">
                                    {(substationData.ptrs132to33 || substationData.ptrs?.filter(p => p.voltageRatio?.includes("132/33")) || []).map(p => (
                                        <option key={p.id} value={`ptr132:${p.id}`}>{p.name} ({p.capacity})</option>
                                    ))}
                                </optgroup>
                                <optgroup label="33KV Feeders">
                                    {substationData.feeders33kV?.map(f => (
                                        <option key={f.id} value={`33f:${f.id}`}>{f.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    {/* Scrollable / Pinchable Diagram Viewport */}
                    <div ref={scrollContainerRef} className="sld-scroll-wrapper">
                        <DynamicSingleLineDiagram
                            data={substationData}
                            onEquipmentClick={handleEquipmentClick}
                            selectedEquipment={selectedEquipment}
                            zoomLevel={zoomLevel}
                            isMobile={isMobile}
                        />
                    </div>
                </div>

                {/* Mobile Bottom-Sheet Drawer for Equipment Details */}
                {selectedEquipment && isMobile && (
                    <div className="mobile-detail-overlay" onClick={() => setSelectedEquipment(null)}>
                        <div className="mobile-detail-sheet" onClick={e => e.stopPropagation()}>
                            <div className="mobile-drag-handle"></div>
                            <DetailPanel
                                equipmentData={selectedEquipment}
                                onClose={() => setSelectedEquipment(null)}
                                onOpenDrawings={(feeder, type) => setDrawingModal({ isOpen: true, feeder, type })}
                            />
                        </div>
                    </div>
                )}

                {/* Desktop Side Panel */}
                {!isMobile && (
                    <DetailPanel
                        equipmentData={selectedEquipment}
                        onClose={() => setSelectedEquipment(null)}
                        onOpenDrawings={(feeder, type) => setDrawingModal({ isOpen: true, feeder, type })}
                    />
                )}
            </div>

            {/* Technical Drawing Viewer Modal */}
            {drawingModal.isOpen && (
                <DrawingViewerModal
                    feeder={drawingModal.feeder}
                    initialType={drawingModal.type}
                    substationData={substationData}
                    onClose={() => setDrawingModal({ isOpen: false, feeder: '', type: '' })}
                />
            )}

            {/* Copyright Footer */}
            <footer style={{ marginTop: '2.5rem', padding: '1.5rem 1rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(15, 23, 42, 0.55)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    TGTRANSCO 220/132/33 KV Huzurnagar Substation &bull; Operational SLD & Asset System
                </div>
                <div style={{ color: '#00d4ff', fontWeight: 700, letterSpacing: '0.5px' }}>
                    &copy; 2026 V. Rajesh. All Rights Reserved.
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(148, 163, 184, 0.75)', marginTop: '0.35rem' }}>
                    Proprietary Engineering Application &bull; Protected Data & Drawings Architecture
                </div>
            </footer>
        </div>
    );
}

// ----------------------------------------------------------------------
// Dynamic SVG SLD Generator (MOBILE COMPATIBLE & SCALABLE)
// ----------------------------------------------------------------------
function DynamicSingleLineDiagram({ data, onEquipmentClick, selectedEquipment, zoomLevel, isMobile }) {
    if (!data) return null;

    const width = 1920;
    const height = 1080;

    const Y_220_MB1 = 150;
    const Y_220_MB2 = 220;
    const Y_132_BUS = 520;
    const Y_33_BUS = 850;

    // Filter PTRs from the single Google Sheet "PTRs" array based on their voltage ratios
    const ptrs220 = data.ptrs220to132 || (data.ptrs && data.ptrs.filter(p => p.voltageRatio && p.voltageRatio.includes("220"))) || [];
    const ptrs132 = data.ptrs132to33 || (data.ptrs && data.ptrs.filter(p => p.voltageRatio && p.voltageRatio.includes("132/33") && !p.voltageRatio.includes("220/132/33"))) || [];

    // Calculate dimensions based on zoom & viewport mode
    let svgStyle = { display: 'block', transition: 'width 0.2s ease-out, min-width 0.2s ease-out' };
    if (zoomLevel === 'fit') {
        svgStyle = {
            ...svgStyle,
            width: '100%',
            height: 'auto',
            maxHeight: isMobile ? '70vh' : '86vh',
            minWidth: '100%'
        };
    } else {
        const factor = zoomLevel || 1;
        const targetWidth = Math.round((isMobile ? 1350 : 1850) * factor);
        svgStyle = {
            ...svgStyle,
            width: `${targetWidth}px`,
            minWidth: `${targetWidth}px`,
            height: 'auto'
        };
    }

    return (
        <svg style={svgStyle} viewBox={`0 -120 ${width} ${height + 250}`} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">

            {/* ====== 220kV BUSES ====== */}
            <line x1="20" y1={Y_220_MB1} x2={width - 20} y2={Y_220_MB1} className="bus-line" strokeWidth="6" stroke="#ff3838" />
            <text x="30" y={Y_220_MB1 - 10} fill="#ff3838" fontSize="28px" fontWeight="bold">220KV MAIN BUS - I</text>

            <line x1="20" y1={Y_220_MB2} x2={width - 20} y2={Y_220_MB2} className="bus-line" strokeWidth="6" stroke="#ff3838" />
            <text x="30" y={Y_220_MB2 - 10} fill="#ff3838" fontSize="28px" fontWeight="bold">220KV MAIN BUS - II</text>

            {/* Bus Coupler */}
            {data.buses220kV && data.buses220kV.busCoupler && (
                <g id="eq-bc_220" className="feeder-group" onClick={() => onEquipmentClick(data.buses220kV.busCoupler, "Coupler")} style={{ cursor: 'pointer' }}>
                    <rect x={(width / 2) - 40} y={Y_220_MB1} width="200" height={Y_220_MB2 - Y_220_MB1} fill="transparent" />
                    <line x1={width / 2} y1={Y_220_MB1} x2={width / 2} y2={Y_220_MB2} stroke="var(--text-secondary)" strokeWidth="3" />
                    <rect x={(width / 2) - 15} y={((Y_220_MB1 + Y_220_MB2) / 2) - 15} width="30" height="30" className={data.buses220kV.busCoupler.breaker?.status === 'Closed' ? 'breaker closed' : 'breaker open'} rx="4" />
                    <text x={(width / 2) + 25} y={((Y_220_MB1 + Y_220_MB2) / 2) + 8} fill="white" fontSize="22px" fontWeight="bold">BUS COUPLER</text>
                </g>
            )}

            {/* ====== 220kV FEEDERS (Drawing UPWARDS) ====== */}
            {data.feeders220kV && data.feeders220kV.map((feeder, i) => {
                const x = 300 + (i * 180);
                const isActive = selectedEquipment && selectedEquipment.id === feeder.id;

                const mb1Closed = feeder.isolators?.bus1Isolator?.status === 'Closed';
                const mb2Closed = feeder.isolators?.bus2Isolator?.status === 'Closed';
                let startY = mb1Closed ? Y_220_MB1 : Y_220_MB2;
                if (!mb1Closed && !mb2Closed) startY = Y_220_MB1;

                return (
                    <g id={`eq-${feeder.id || i}`} key={feeder.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(feeder, "220kV Feeder")} style={{ cursor: 'pointer' }}>
                        {/* Invisible Touch Hit-box for Mobile */}
                        <rect x={x - 45} y={startY - 130} width="90" height="150" fill="transparent" />
                        <line x1={x} y1={startY} x2={x} y2={50} stroke="#ff3838" strokeWidth="2" />
                        {(mb1Closed || mb2Closed) && <circle cx={x} cy={startY} r="5" fill="var(--accent-red)" />}
                        <rect x={x - 8} y={startY - 30} width="16" height="20" stroke="white" strokeWidth="2" fill="none" />
                        <rect x={x - 15} y={startY - 70} width="30" height="30" className={feeder.breaker?.status === 'Closed' ? 'breaker closed' : 'breaker open'} rx="3" />
                        <circle cx={x} cy={startY - 100} r="10" stroke="white" strokeWidth="2" fill="none" />
                        <text x={x} y={15} transform={`rotate(-45 ${x} 15)`} textAnchor="start" fill="white" fontSize="20px" fontWeight="800">
                            {feeder.name || `220kV F-${i + 1}`}
                        </text>
                    </g>
                );
            })}

            {/* ====== 220/132kV PTRs ====== */}
            {ptrs220.map((ptr, i) => {
                const x = 1200 + (i * 300);
                const isActive = selectedEquipment && selectedEquipment.id === ptr.id;

                const mb1Closed = ptr.hvSide?.isolators?.bus1Isolator?.status === 'Closed';
                let startY = mb1Closed ? Y_220_MB1 : Y_220_MB2;

                return (
                    <g id={`eq-${ptr.id || i}`} key={ptr.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(ptr, "PTR 220/132kV")} style={{ cursor: 'pointer' }}>
                        {/* Invisible Touch Hit-box for Mobile */}
                        <rect x={x - 50} y={startY} width="100" height={Y_132_BUS - startY} fill="transparent" />
                        <line x1={x} y1={startY} x2={x} y2={Y_132_BUS} stroke="#a855f7" strokeWidth="4" />
                        <rect x={x - 15} y={startY + 40} width="30" height="30" className={ptr.hvSide?.breaker?.status === 'Closed' ? 'breaker closed' : 'breaker open'} rx="3" />
                        <circle cx={x} cy={330} r="35" stroke="#a855f7" strokeWidth="3" fill="none" />
                        <circle cx={x} cy={380} r="35" stroke="#a855f7" strokeWidth="3" fill="none" />
                        <rect x={x - 15} y={Y_132_BUS - 60} width="30" height="30" className={ptr.lvSide?.breaker?.status === 'Closed' ? 'breaker closed' : 'breaker open'} rx="3" />
                        <text x={x + 45} y={345} fill="#a855f7" fontSize="24px" fontWeight="bold">{ptr.name}</text>
                        <text x={x + 45} y={380} fill="#e2e8f0" fontSize="20px">{ptr.capacity}</text>
                    </g>
                );
            })}

            {/* ====== 132kV BUS ====== */}
            <line x1="20" y1={Y_132_BUS} x2={width - 20} y2={Y_132_BUS} strokeWidth="6" stroke="#00d4ff" />
            <text x="30" y={Y_132_BUS - 10} fill="#00d4ff" fontSize="28px" fontWeight="bold">132KV MAIN BUS</text>

            {/* ====== 132kV FEEDERS (Drawing DOWNWARDS) ====== */}
            {data.feeders132kV && data.feeders132kV.map((feeder, i) => {
                const x = 300 + (i * 180);
                const isActive = selectedEquipment && selectedEquipment.id === feeder.id;
                return (
                    <g id={`eq-${feeder.id || i}`} key={feeder.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(feeder, "132kV Feeder")} style={{ cursor: 'pointer' }}>
                        {/* Invisible Touch Hit-box for Mobile */}
                        <rect x={x - 45} y={Y_132_BUS} width="90" height="230" fill="transparent" />
                        <line x1={x} y1={Y_132_BUS} x2={x} y2={Y_132_BUS + 180} stroke="#00d4ff" strokeWidth="2" />
                        <rect x={x - 8} y={Y_132_BUS + 30} width="16" height="20" stroke="white" strokeWidth="2" fill="none" />
                        <rect x={x - 15} y={Y_132_BUS + 70} width="30" height="30" className={feeder.breaker?.status === 'Closed' ? 'breaker closed' : 'breaker open'} rx="3" />
                        <circle cx={x} cy={Y_132_BUS + 120} r="10" stroke="white" strokeWidth="2" fill="none" />
                        <text x={x - 5} y={Y_132_BUS + 200} transform={`rotate(-45 ${x - 5} ${Y_132_BUS + 200})`} textAnchor="end" fill="white" fontSize="20px" fontWeight="800">
                            {feeder.name || `132kV F-${i + 1}`}
                        </text>
                    </g>
                );
            })}

            {/* ====== 132/33kV PTRs ====== */}
            {ptrs132.map((ptr, i) => {
                const x = 1200 + (i * 300);
                const isActive = selectedEquipment && selectedEquipment.id === ptr.id;
                return (
                    <g id={`eq-${ptr.id || i}`} key={ptr.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(ptr, "PTR 132/33kV")} style={{ cursor: 'pointer' }}>
                        {/* Invisible Touch Hit-box for Mobile */}
                        <rect x={x - 50} y={Y_132_BUS} width="100" height={Y_33_BUS - Y_132_BUS} fill="transparent" />
                        <line x1={x} y1={Y_132_BUS} x2={x} y2={Y_33_BUS} stroke="#ffd600" strokeWidth="4" />
                        <rect x={x - 15} y={Y_132_BUS + 40} width="30" height="30" className={ptr.hvSide?.breaker?.status === 'Closed' ? 'breaker closed' : 'breaker open'} rx="3" />
                        <circle cx={x} cy={660} r="35" stroke="#ffd600" strokeWidth="3" fill="none" />
                        <circle cx={x} cy={710} r="35" stroke="#ffd600" strokeWidth="3" fill="none" />
                        <rect x={x - 15} y={Y_33_BUS - 60} width="30" height="30" className={ptr.lvSide?.breaker?.status === 'Closed' ? 'breaker closed' : 'breaker open'} rx="3" />
                        <text x={x + 45} y={670} fill="#ffd600" fontSize="24px" fontWeight="bold">{ptr.name}</text>
                        <text x={x + 45} y={710} fill="#e2e8f0" fontSize="20px">{ptr.capacity}</text>
                    </g>
                );
            })}

            {/* ====== 33kV BUS ====== */}
            <line x1="20" y1={Y_33_BUS} x2={width - 20} y2={Y_33_BUS} strokeWidth="6" stroke="#00ff88" />
            <text x="30" y={Y_33_BUS - 10} fill="#00ff88" fontSize="28px" fontWeight="bold">33KV MAIN BUS</text>

            {/* ====== 33kV FEEDERS (Drawing DOWNWARDS) ====== */}
            {data.feeders33kV && data.feeders33kV.map((feeder, i) => {
                const x = 300 + (i * 200);
                const isActive = selectedEquipment && selectedEquipment.id === feeder.id;
                return (
                    <g id={`eq-${feeder.id || i}`} key={feeder.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(feeder, "33kV Feeder")} style={{ cursor: 'pointer' }}>
                        {/* Invisible Touch Hit-box for Mobile */}
                        <rect x={x - 45} y={Y_33_BUS} width="90" height="200" fill="transparent" />
                        <line x1={x} y1={Y_33_BUS} x2={x} y2={Y_33_BUS + 150} stroke="#00ff88" strokeWidth="2" />
                        <rect x={x - 15} y={Y_33_BUS + 40} width="30" height="30" className={feeder.breaker?.status === 'Closed' ? 'breaker closed' : 'breaker open'} rx="3" />
                        <circle cx={x} cy={Y_33_BUS + 95} r="10" stroke="white" strokeWidth="2" fill="none" />
                        <text x={x - 5} y={Y_33_BUS + 170} transform={`rotate(-45 ${x - 5} ${Y_33_BUS + 170})`} textAnchor="end" fill="white" fontSize="20px" fontWeight="800">
                            {feeder.name || `33kV F-${i + 1}`}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ----------------------------------------------------------------------
// Detail Panel Component (FULLY EXPANDED DATA)
// ----------------------------------------------------------------------
function DetailPanel({ equipmentData, onClose, onOpenDrawings }) {
    if (!equipmentData) {
        return (
            <div className="detail-panel" style={{ padding: '2rem' }}>
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ fontSize: '5rem' }}>📋</div>
                    <div className="empty-state-text" style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                        Select any Feeder or PTR on the massive diagram<br />to check configurations and parameters.
                    </div>
                </div>
            </div>
        );
    }

    const type = equipmentData.__type || "Equipment Details";

    return (
        <div className="detail-panel" style={{ padding: '1.5rem', fontSize: '1.1rem', overflowY: 'auto' }}>
            <div className="panel-header">
                <div className="panel-title" style={{ fontSize: '1.5rem' }}>{type}</div>
                <button className="close-btn" style={{ fontSize: '2rem' }} onClick={onClose}>×</button>
            </div>

            {type === "DC System" && equipmentData.__data && (
                <div className="detail-section">
                    {equipmentData.__data.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0, 212, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '1.2rem', color: '#00d4ff', marginBottom: '0.5rem', fontWeight: 'bold' }}>{item.equipment || `Item ${idx+1}`}</div>
                            {Object.entries(item).map(([key, val]) => {
                                if (key === 'equipment' || key.endsWith('Link')) return null;
                                return (
                                    <div key={key} className="detail-item" style={{ padding: '0.6rem', marginBottom: '0.3rem' }}>
                                        <span className="detail-label" style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="detail-value">{val}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    {equipmentData.__data.length === 0 && <div className="detail-item">No DC System data available.</div>}
                </div>
            )}

            {type === "Staff Details" && equipmentData.__data && (
                <div className="detail-section">
                    {equipmentData.__data.map((staff, idx) => (
                        <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '1.2rem', color: '#a855f7', marginBottom: '0.5rem', fontWeight: 'bold' }}>{staff.name || `Staff ${idx+1}`}</div>
                            {Object.entries(staff).map(([key, val]) => {
                                if (key === 'name' || key.endsWith('Link')) return null;
                                return (
                                    <div key={key} className="detail-item" style={{ padding: '0.6rem', marginBottom: '0.3rem' }}>
                                        <span className="detail-label" style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="detail-value">{val}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    {equipmentData.__data.length === 0 && <div className="detail-item">No Staff Details available.</div>}
                </div>
            )}

            {type !== "DC System" && type !== "Staff Details" && (
                <>

            {/* General Info */}
            <div className="detail-section">
                <div className="detail-item" style={{ padding: '0.8rem' }}>
                    <span className="detail-label">Name</span>
                    <span className="detail-value" style={{ fontSize: '1.1rem' }}>{equipmentData.name || "N/A"}</span>
                </div>
                {equipmentData.doc && (
                    <div className="detail-item" style={{ padding: '0.8rem' }}>
                        <span className="detail-label">Date of Commissioning</span>
                        <span className="detail-value" style={{ color: '#00d4ff', fontWeight: 'bold' }}>{equipmentData.doc}</span>
                    </div>
                )}
                {equipmentData.voltage && (
                    <div className="detail-item" style={{ padding: '0.8rem' }}>
                        <span className="detail-label">Voltage Level</span>
                        <span className="detail-value">{equipmentData.voltage}</span>
                    </div>
                )}
                {equipmentData.length && (
                    <div className="detail-item" style={{ padding: '0.8rem' }}>
                        <span className="detail-label">Line Length</span>
                        <span className="detail-value">{equipmentData.length}</span>
                    </div>
                )}
                {equipmentData.conductor && (
                    <div className="detail-item" style={{ padding: '0.8rem' }}>
                        <span className="detail-label">Conductor Type</span>
                        <span className="detail-value">{equipmentData.conductor}</span>
                    </div>
                )}
                {equipmentData.mapLink && (
                    <div className="detail-item" style={{ padding: '0.8rem' }}>
                        <span className="detail-label">Tower Locations</span>
                        <span className="detail-value" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                            <a href={`/towers?line=${encodeURIComponent(equipmentData.name || '')}`} style={{ color: '#00d4ff', textDecoration: 'underline', fontWeight: 'bold' }}>📍 View Tower Table ↗</a>
                        </span>
                    </div>
                )}
            </div>

            {/* Feeder Technical Drawings Section */}
            <div className="detail-section" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(0, 212, 255, 0.05) 100%)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '10px', padding: '1rem', marginTop: '1rem' }}>
                <div className="section-title" style={{ fontSize: '1.15rem', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>📐 Technical Drawings</span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.25)', color: '#e9d5ff', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official CAD</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: '1.4' }}>
                    Schematic diagrams and wiring drawings for Control & Relay (C&R) panels and circuit breakers for <strong>{equipmentData.name || type}</strong>.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.55rem' }}>
                    <button
                        type="button"
                        className="control-btn"
                        onClick={() => onOpenDrawings && onOpenDrawings(equipmentData.name || type, 'C&R Panel')}
                        style={{ width: '100%', borderColor: '#a855f7', color: '#f3e8ff', background: 'rgba(168, 85, 247, 0.2)', padding: '0.6rem 0.8rem', fontSize: '0.88rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', borderRadius: '6px' }}
                    >
                        📐 View C&R Panel Drawing
                    </button>
                    <button
                        type="button"
                        className="control-btn"
                        onClick={() => onOpenDrawings && onOpenDrawings(equipmentData.name || type, 'Circuit Breaker')}
                        style={{ width: '100%', borderColor: '#00d4ff', color: '#e0f2fe', background: 'rgba(0, 212, 255, 0.15)', padding: '0.6rem 0.8rem', fontSize: '0.88rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', borderRadius: '6px' }}
                    >
                        ⚡ View Breaker Schematic Drawing
                    </button>
                </div>
            </div>

            {/* PTR Specific Variables */}
            {(equipmentData.capacity || equipmentData.impedance || equipmentData.yearOfMfg) && (
                <div className="detail-section">
                    <div className="section-title" style={{ fontSize: '1.2rem' }}>Transformer Data</div>
                    {equipmentData.capacity && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">Capacity</span>
                            <span className="detail-value" style={{ color: 'var(--accent-yellow)', fontSize: '1.2rem' }}>{equipmentData.capacity}</span>
                        </div>
                    )}
                    {equipmentData.make && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">PTR Make</span>
                            <span className="detail-value">{equipmentData.make}</span>
                        </div>
                    )}
                    {equipmentData.yearOfMfg && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">D.O.C / Year</span>
                            <span className="detail-value">{equipmentData.yearOfMfg}</span>
                        </div>
                    )}
                    {equipmentData.impedance && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">Impedance</span>
                            <span className="detail-value">{equipmentData.impedance}</span>
                        </div>
                    )}
                    {equipmentData.vectorGroup && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">Vector Group</span>
                            <span className="detail-value">{equipmentData.vectorGroup}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Breaker Details */}
            {(equipmentData.breaker || equipmentData.hvSide) && (
                <div className="detail-section">
                    <div className="section-title" style={{ fontSize: '1.2rem' }}>Main Breaker Status</div>

                    {/* Handle nested PTR breakers natively */}
                    {equipmentData.hvSide && equipmentData.hvSide.breaker && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">HV Breaker Make/Rating</span>
                            <span className="detail-value">{equipmentData.hvSide.breaker.make || ""} {equipmentData.hvSide.breaker.rating || ""}</span>
                        </div>
                    )}

                    {equipmentData.breaker && (
                        <>
                            {(equipmentData.breaker.type || equipmentData.breaker.make) && (
                                <div className="detail-item" style={{ padding: '0.8rem' }}>
                                    <span className="detail-label">Breaker Make / Type</span>
                                    <span className="detail-value">{equipmentData.breaker.make || ""} {equipmentData.breaker.type || ""}</span>
                                </div>
                            )}
                            {equipmentData.breaker.rating && (
                                <div className="detail-item" style={{ padding: '0.8rem' }}>
                                    <span className="detail-label">Rating</span>
                                    <span className="detail-value">{equipmentData.breaker.rating}</span>
                                </div>
                            )}
                            {equipmentData.breaker.year && (
                                <div className="detail-item" style={{ padding: '0.8rem' }}>
                                    <span className="detail-label">D.O.C / Year</span>
                                    <span className="detail-value">{equipmentData.breaker.year}</span>
                                </div>
                            )}
                            <div className="detail-item" style={{ padding: '1rem', background: equipmentData.breaker.status === 'Closed' ? 'rgba(255,56,56,0.1)' : 'rgba(0,255,136,0.1)' }}>
                                <span className="detail-label">Current State</span>
                                <span className="detail-value" style={{ fontSize: '1.4rem', fontWeight: 'bold', color: equipmentData.breaker.status === 'Closed' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                    {equipmentData.breaker.status}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* CT Details */}
            {equipmentData.ct && (
                <div className="detail-section">
                    <div className="section-title" style={{ fontSize: '1.2rem' }}>Current Transformer</div>
                    {equipmentData.ct.make && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">Make</span>
                            <span className="detail-value">{equipmentData.ct.make}</span>
                        </div>
                    )}
                    {equipmentData.ct.ratio && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">Ratio</span>
                            <span className="detail-value">{equipmentData.ct.ratio}</span>
                        </div>
                    )}
                    {equipmentData.ct.accuracy && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">Accuracy Class</span>
                            <span className="detail-value">{equipmentData.ct.accuracy}</span>
                        </div>
                    )}
                    {equipmentData.ct.burden && (
                        <div className="detail-item" style={{ padding: '0.8rem' }}>
                            <span className="detail-label">Burden</span>
                            <span className="detail-value">{equipmentData.ct.burden}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Testing & Maintenance Details */}
            {(equipmentData.mrtTestDate || equipmentData.treTestDate) && (
                 <div className="detail-section">
                     <div className="section-title" style={{ fontSize: '1.2rem' }}>Testing & Maintenance</div>
                     {equipmentData.mrtTestDate && (
                         <div className="detail-item" style={{ padding: '0.8rem' }}>
                             <span className="detail-label">Last MRT Test</span>
                             <span className="detail-value" style={{ color: 'var(--accent-yellow)' }}>{equipmentData.mrtTestDate}</span>
                         </div>
                     )}
                     {equipmentData.treTestDate && (
                         <div className="detail-item" style={{ padding: '0.8rem' }}>
                             <span className="detail-label">Last TRE Test</span>
                             <span className="detail-value" style={{ color: 'var(--accent-yellow)' }}>{equipmentData.treTestDate}</span>
                         </div>
                     )}
                 </div>
            )}
            </>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// Technical Drawing Viewer Modal Component
// ----------------------------------------------------------------------
function DrawingViewerModal({ feeder, initialType, substationData, onClose }) {
    const [selectedFeeder, setSelectedFeeder] = useState(feeder || "220KV Damercherla-1");
    const [drawingType, setDrawingType] = useState(initialType || "C&R Panel");

    // Gather all feeders and PTR options
    const feeders220 = substationData?.feeders220kV?.map(f => f.name) || [
        "220KV Damercherla-1", "220KV Damercherla-2", "220KV Sithapuram", "220KV Narketpally"
    ];
    const feeders132 = substationData?.feeders132kV?.map(f => f.name) || [
        "132KV Mattampally-1", "132KV Mattampally-2", "132KV Vepalasingaram-1", "132KV Vepalasingaram-2"
    ];
    const ptrs = [
        "100MVA PTR-1 (220/132KV)",
        "100MVA PTR-2 (220/132KV)",
        "PTR-1 (132/33KV)",
        "PTR-2 (132/33KV)"
    ];

    const isCr = drawingType === "C&R Panel";

    return (
        <div className="map-modal-overlay open" onClick={onClose} style={{ zIndex: 1100 }}>
            <div className="map-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '960px', width: '95vw', background: '#0b1120', border: '2px solid #2a3b5c', boxShadow: '0 25px 65px rgba(0,0,0,0.85)' }}>
                {/* Header */}
                <div className="map-modal-header" style={{ background: 'linear-gradient(90deg, #111a2e 0%, #17223b 100%)', borderBottom: '1px solid #243552', padding: '1.1rem 1.5rem' }}>
                    <div className="map-modal-title" style={{ fontSize: '1.25rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span>📐</span>
                        <span>Technical Drawings Library &bull; {selectedFeeder}</span>
                    </div>
                    <button className="close-btn" onClick={onClose} style={{ fontSize: '1.8rem', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>×</button>
                </div>

                {/* Sub-toolbar: Feeder Switcher & Drawing Type Selector */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '0.85rem 1.5rem', background: '#0d1527', borderBottom: '1px solid #1f2d47', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Select Feeder/PTR:</span>
                        <select
                            value={selectedFeeder}
                            onChange={e => setSelectedFeeder(e.target.value)}
                            style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.88rem', outline: 'none' }}
                        >
                            <optgroup label="220KV Feeders">
                                {feeders220.map(name => <option key={name} value={name}>{name}</option>)}
                            </optgroup>
                            <optgroup label="132KV Feeders">
                                {feeders132.map(name => <option key={name} value={name}>{name}</option>)}
                            </optgroup>
                            <optgroup label="Power Transformers (PTRs)">
                                {ptrs.map(name => <option key={name} value={name}>{name}</option>)}
                            </optgroup>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="button"
                            className={`control-btn ${isCr ? 'active' : ''}`}
                            onClick={() => setDrawingType("C&R Panel")}
                            style={{
                                padding: '0.45rem 0.9rem',
                                fontSize: '0.85rem',
                                background: isCr ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                borderColor: isCr ? '#a855f7' : 'var(--border-color)',
                                color: isCr ? '#d8b4fe' : 'var(--text-secondary)'
                            }}
                        >
                            📐 C&R Panel Drawing
                        </button>
                        <button
                            type="button"
                            className={`control-btn ${!isCr ? 'active' : ''}`}
                            onClick={() => setDrawingType("Circuit Breaker")}
                            style={{
                                padding: '0.45rem 0.9rem',
                                fontSize: '0.85rem',
                                background: !isCr ? 'rgba(0, 212, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                borderColor: !isCr ? '#00d4ff' : 'var(--border-color)',
                                color: !isCr ? '#7dd3fc' : 'var(--text-secondary)'
                            }}
                        >
                            ⚡ Breaker Schematic Drawing
                        </button>
                    </div>
                </div>

                {/* Blueprint Canvas View */}
                <div className="map-modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', maxHeight: '72vh' }}>
                    <div style={{
                        background: '#041026',
                        backgroundImage: 'radial-gradient(rgba(0, 212, 255, 0.12) 1px, transparent 1px), radial-gradient(rgba(0, 212, 255, 0.06) 1px, #041026 1px)',
                        backgroundSize: '24px 24px',
                        border: '2px solid #0284c7',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        position: 'relative',
                        boxShadow: 'inset 0 0 40px rgba(0, 100, 200, 0.2)'
                    }}>
                        {/* Blueprint Corner Ticks */}
                        <div style={{ position: 'absolute', top: '8px', left: '8px', width: '16px', height: '16px', borderTop: '2px solid #38bdf8', borderLeft: '2px solid #38bdf8' }}></div>
                        <div style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderTop: '2px solid #38bdf8', borderRight: '2px solid #38bdf8' }}></div>
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '16px', height: '16px', borderBottom: '2px solid #38bdf8', borderLeft: '2px solid #38bdf8' }}></div>
                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '16px', height: '16px', borderBottom: '2px solid #38bdf8', borderRight: '2px solid #38bdf8' }}></div>

                        {/* Top Substation Header Banner */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                    TGTRANSCO 220/132/33 KV Huzurnagar Substation
                                </div>
                                <div style={{ fontSize: '0.88rem', color: '#93c5fd', marginTop: '0.2rem' }}>
                                    {isCr ? 'Control & Relay (C&R) Panel Schematic & Wiring Diagram' : 'Circuit Breaker Control, Trip & Interlocking Schematic'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid #0284c7', borderRadius: '4px', padding: '0.25rem 0.6rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                                    OFFICIAL SCHEMATIC
                                </span>
                            </div>
                        </div>

                        {/* Schematic Architectural SVG Diagram */}
                        <div style={{ width: '100%', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 22, 54, 0.65)', border: '1px dashed rgba(56, 189, 248, 0.4)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                            {isCr ? (
                                <svg viewBox="0 0 760 220" style={{ width: '100%', maxWidth: '720px', height: 'auto' }}>
                                    {/* Busbar & Incomer */}
                                    <line x1="40" y1="35" x2="720" y2="35" stroke="#38bdf8" strokeWidth="4" />
                                    <text x="50" y="25" fill="#38bdf8" fontSize="12" fontWeight="bold">MAIN BUSBAR — 220KV / 132KV</text>

                                    {/* Isolator 89 */}
                                    <line x1="200" y1="35" x2="200" y2="70" stroke="#93c5fd" strokeWidth="2.5" />
                                    <line x1="190" y1="70" x2="210" y2="70" stroke="#93c5fd" strokeWidth="2.5" />
                                    <line x1="195" y1="70" x2="215" y2="90" stroke="#38bdf8" strokeWidth="2.5" />
                                    <text x="220" y="80" fill="#bae6fd" fontSize="11">89 (Bus Isolator)</text>

                                    {/* Circuit Breaker 52 */}
                                    <line x1="200" y1="95" x2="200" y2="115" stroke="#93c5fd" strokeWidth="2.5" />
                                    <rect x="185" y="115" width="30" height="30" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" rx="4" />
                                    <text x="193" y="134" fill="#ffffff" fontSize="11" fontWeight="bold">52</text>
                                    <text x="225" y="133" fill="#bae6fd" fontSize="11">CB (Trip Coil 94)</text>

                                    {/* Current Transformer CT */}
                                    <line x1="200" y1="145" x2="200" y2="175" stroke="#93c5fd" strokeWidth="2.5" />
                                    <circle cx="200" cy="180" r="10" fill="none" stroke="#38bdf8" strokeWidth="2" />
                                    <circle cx="200" cy="190" r="10" fill="none" stroke="#38bdf8" strokeWidth="2" />
                                    <text x="225" y="185" fill="#bae6fd" fontSize="11">CT Class PS / 5P20</text>

                                    {/* Protection Relay Block */}
                                    <rect x="420" y="70" width="280" height="120" fill="rgba(14, 116, 144, 0.25)" stroke="#38bdf8" strokeWidth="2" rx="8" />
                                    <text x="435" y="95" fill="#38bdf8" fontSize="13" fontWeight="bold">C&R PANEL RELAYS & ANNUNCIATION</text>
                                    <line x1="435" y1="105" x2="685" y2="105" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" />
                                    <text x="435" y="125" fill="#e0f2fe" fontSize="11">&bull; Numerical Distance Relay (21 / 21N)</text>
                                    <text x="435" y="145" fill="#e0f2fe" fontSize="11">&bull; Backup Non-Directional Overcurrent (50/51)</text>
                                    <text x="435" y="165" fill="#e0f2fe" fontSize="11">&bull; Master Trip Relay (86A / 86B) & Alarm (30)</text>

                                    {/* Secondary Wiring Signal Path */}
                                    <path d="M210 180 H350 V130 H420" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 4" />
                                    <text x="260" y="145" fill="#d8b4fe" fontSize="10">CT Secondary (1A/5A)</text>
                                    <path d="M420 155 H320 V130 H215" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                                    <text x="260" y="120" fill="#fca5a5" fontSize="10">DC Trip Signal (110V)</text>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 760 220" style={{ width: '100%', maxWidth: '720px', height: 'auto' }}>
                                    {/* Breaker Control & Trip Circuit */}
                                    <line x1="50" y1="35" x2="710" y2="35" stroke="#ef4444" strokeWidth="3" />
                                    <text x="60" y="25" fill="#fca5a5" fontSize="12" fontWeight="bold">+110V DC CONTROL BUS</text>

                                    <line x1="50" y1="195" x2="710" y2="195" stroke="#38bdf8" strokeWidth="3" />
                                    <text x="60" y="210" fill="#bae6fd" fontSize="12" fontWeight="bold">-110V DC RETURN BUS</text>

                                    {/* Branch 1: Close Circuit with Anti-pumping 52Y */}
                                    <line x1="150" y1="35" x2="150" y2="60" stroke="#93c5fd" strokeWidth="2" />
                                    <rect x="135" y="60" width="30" height="20" fill="rgba(2, 132, 199, 0.4)" stroke="#38bdf8" strokeWidth="1.5" />
                                    <text x="140" y="74" fill="#ffffff" fontSize="9">TNC-C</text>
                                    <line x1="150" y1="80" x2="150" y2="105" stroke="#93c5fd" strokeWidth="2" />
                                    <circle cx="150" cy="120" r="15" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
                                    <text x="140" y="124" fill="#ffffff" fontSize="9" fontWeight="bold">52CC</text>
                                    <text x="100" y="150" fill="#93c5fd" fontSize="10">Closing Coil</text>
                                    <line x1="150" y1="135" x2="150" y2="195" stroke="#93c5fd" strokeWidth="2" />

                                    {/* Branch 2: Trip Coil 1 (TC1) */}
                                    <line x1="330" y1="35" x2="330" y2="60" stroke="#ef4444" strokeWidth="2" />
                                    <rect x="315" y="60" width="30" height="20" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="1.5" />
                                    <text x="320" y="74" fill="#ffffff" fontSize="9">86-A</text>
                                    <line x1="330" y1="80" x2="330" y2="105" stroke="#ef4444" strokeWidth="2" />
                                    <circle cx="330" cy="120" r="15" fill="#b91c1c" stroke="#f87171" strokeWidth="2" />
                                    <text x="320" y="124" fill="#ffffff" fontSize="9" fontWeight="bold">TC1</text>
                                    <text x="290" y="150" fill="#fca5a5" fontSize="10">Trip Coil 1</text>
                                    <line x1="330" y1="135" x2="330" y2="195" stroke="#ef4444" strokeWidth="2" />

                                    {/* Branch 3: Trip Coil 2 (TC2 - Redundant) */}
                                    <line x1="510" y1="35" x2="510" y2="60" stroke="#ef4444" strokeWidth="2" />
                                    <rect x="495" y="60" width="30" height="20" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="1.5" />
                                    <text x="500" y="74" fill="#ffffff" fontSize="9">86-B</text>
                                    <line x1="510" y1="80" x2="510" y2="105" stroke="#ef4444" strokeWidth="2" />
                                    <circle cx="510" cy="120" r="15" fill="#b91c1c" stroke="#f87171" strokeWidth="2" />
                                    <text x="500" y="124" fill="#ffffff" fontSize="9" fontWeight="bold">TC2</text>
                                    <text x="470" y="150" fill="#fca5a5" fontSize="10">Trip Coil 2 (Dup)</text>
                                    <line x1="510" y1="135" x2="510" y2="195" stroke="#ef4444" strokeWidth="2" />

                                    {/* Branch 4: SF6 Pressure & Spring Charge Motor */}
                                    <rect x="620" y="60" width="105" height="100" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="1.5" rx="6" />
                                    <text x="630" y="80" fill="#34d399" fontSize="10" fontWeight="bold">BREAKER AUX</text>
                                    <text x="630" y="102" fill="#a7f3d0" fontSize="9">&bull; 63G SF6 OK</text>
                                    <text x="630" y="122" fill="#a7f3d0" fontSize="9">&bull; 88M Motor OK</text>
                                    <text x="630" y="142" fill="#a7f3d0" fontSize="9">&bull; 52a/b Contacts</text>
                                </svg>
                            )}
                        </div>

                        {/* Title Block in standard CAD blueprint lower corner */}
                        <div style={{
                            background: '#0a1628',
                            border: '1.5px solid #0284c7',
                            borderRadius: '8px',
                            padding: '0.85rem 1.25rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.75rem',
                            fontSize: '0.85rem'
                        }}>
                            <div>
                                <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Substation / Division</span>
                                <strong style={{ color: '#f8fafc' }}>TGTRANSCO Huzurnagar 220KV</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Target Feeder / Equipment</span>
                                <strong style={{ color: '#38bdf8' }}>{selectedFeeder}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Drawing Document Category</span>
                                <strong style={{ color: '#c084fc' }}>{drawingType} Drawing</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Engineer / Copyright</span>
                                <strong style={{ color: '#4ade80' }}>&copy; 2026 V. Rajesh</strong>
                            </div>
                        </div>

                        {/* Repository Storage Notice */}
                        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', fontSize: '0.82rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span>ℹ️</span>
                            <span>
                                <strong>Drawing Repository Notice:</strong> The schematic drawing profile for <strong>{selectedFeeder}</strong> is established. Full CAD drawings / master PDF schematics provided by <strong>V. Rajesh</strong> will be loaded securely from the server drawings library.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#0d1527', borderTop: '1px solid #1f2d47', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        &copy; 2026 V. Rajesh &bull; TGTRANSCO 220/132/33 KV Huzurnagar Substation
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button
                            type="button"
                            className="control-btn"
                            onClick={() => window.print()}
                            style={{ borderColor: '#38bdf8', color: '#38bdf8', fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
                        >
                            🖨️ Print Blueprint
                        </button>
                        <button
                            type="button"
                            className="control-btn"
                            onClick={onClose}
                            style={{ borderColor: 'var(--border-color)', color: '#f8fafc', fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
