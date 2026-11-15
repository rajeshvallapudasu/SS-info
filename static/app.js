const { useState, useEffect } = React;

function App() {
    const [substationData, setSubstationData] = useState(null);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [loading, setLoading] = useState(true);

    const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbyczowAg-w1ZDErilMq27LP6XN6Es7cmGIeiIC3Zvl4l43i5nU54186Ism9BeqtC12vRg/exec";

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
        <div className="container" style={{ maxWidth: '100%', padding: '1rem' }}>
            <div className="header" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <div className="header-content">
                    <div className="header-title" style={{ flexWrap: 'wrap' }}>
                        <div className="header-icon">⚡</div>
                        <div>
                            <h1>{substationData.name} - Dynamic SLD</h1>
                            <div className="header-subtitle" style={{ fontSize: '1.2rem', color: '#00d4ff', marginBottom: extraDetails.length > 0 ? '0.5rem' : '0' }}>
                                High Visibility Layout | {substationData.voltage}
                            </div>
                            {extraDetails.length > 0 && (
                                <div className="extra-details" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    {extraDetails.map(key => {
                                        const val = substationData[key];
                                        const isLink = typeof val === 'string' && val.startsWith('http');
                                        return (
                                            <span key={key} style={{ background: 'rgba(0,212,255,0.1)', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.95rem', color: '#e2e8f0', border: '1px solid rgba(0,212,255,0.2)' }}>
                                                <strong style={{ color: '#00d4ff', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
                                                {isLink ? <a href={val} target="_blank" rel="noopener noreferrer" style={{color: '#fff', textDecoration: 'underline'}}>View Link</a> : val}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <a href="/towers" className="control-btn" style={{ fontSize: '1rem', padding: '0.6rem 1.2rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#ffd600', color: '#ffd600' }}>🗼 Tower Locations</a>
                            <button className="control-btn" onClick={() => handleEquipmentClick({ __data: substationData.dcSystem || [] }, "DC System")} style={{ fontSize: '1rem', padding: '0.6rem 1.2rem', borderColor: '#00d4ff', color: '#00d4ff' }}>🔋 DC System</button>
                            <button className="control-btn" onClick={() => handleEquipmentClick({ __data: substationData.staffDetails || [] }, "Staff Details")} style={{ fontSize: '1rem', padding: '0.6rem 1.2rem', borderColor: '#a855f7', color: '#a855f7' }}>👥 Staff Details</button>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="control-btn" onClick={refreshLayout} style={{ fontSize: '1rem', padding: '0.6rem 1.2rem' }}>🔄 Refresh Layout</button>
                            <button className="control-btn" onClick={toggleFullScreen} style={{ fontSize: '1rem', padding: '0.6rem 1.2rem' }}>🔲 Full Screen</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-layout" style={{ gridTemplateColumns: '1fr 450px', minHeight: '85vh', gap: '1rem' }}>
                <div id="sld-fullscreen-wrapper" className="diagram-area" style={{ padding: '1rem', overflow: 'hidden', backgroundColor: '#0a0e1a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="sld-container" style={{ width: '100%', height: '100%', padding: '0', backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center' }}>
                        <DynamicSingleLineDiagram
                            data={substationData}
                            onEquipmentClick={handleEquipmentClick}
                            selectedEquipment={selectedEquipment}
                        />
                    </div>
                </div>

                <DetailPanel
                    equipmentData={selectedEquipment}
                    onClose={() => setSelectedEquipment(null)}
                />
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Dynamic SVG SLD Generator (FITS ONE SCREEN)
// ----------------------------------------------------------------------
function DynamicSingleLineDiagram({ data, onEquipmentClick, selectedEquipment }) {
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

    return (
        <svg style={{ width: '100%', height: '100%', maxHeight: '95vh', display: 'block' }} viewBox={`0 -120 ${width} ${height + 250}`} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">

            {/* ====== 220kV BUSES ====== */}
            <line x1="20" y1={Y_220_MB1} x2={width - 20} y2={Y_220_MB1} className="bus-line" strokeWidth="6" stroke="#ff3838" />
            <text x="30" y={Y_220_MB1 - 10} fill="#ff3838" fontSize="28px" fontWeight="bold">220KV MAIN BUS - I</text>

            <line x1="20" y1={Y_220_MB2} x2={width - 20} y2={Y_220_MB2} className="bus-line" strokeWidth="6" stroke="#ff3838" />
            <text x="30" y={Y_220_MB2 - 10} fill="#ff3838" fontSize="28px" fontWeight="bold">220KV MAIN BUS - II</text>

            {/* Bus Coupler */}
            {data.buses220kV && data.buses220kV.busCoupler && (
                <g className="feeder-group" onClick={() => onEquipmentClick(data.buses220kV.busCoupler, "Coupler")}>
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
                    <g key={feeder.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(feeder, "220kV Feeder")}>
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
                    <g key={ptr.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(ptr, "PTR 220/132kV")}>
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
                    <g key={feeder.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(feeder, "132kV Feeder")}>
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
                    <g key={ptr.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(ptr, "PTR 132/33kV")}>
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
                    <g key={feeder.id || i} className={`feeder-group ${isActive ? 'active' : ''}`} onClick={() => onEquipmentClick(feeder, "33kV Feeder")}>
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
function DetailPanel({ equipmentData, onClose }) {
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
                            <a href={`/towers?line=${encodeURIComponent(equipmentData.name || '')}`} style={{ color: '#00d4ff', textDecoration: 'underline', fontWeight: 'bold' }}>View Table ↗</a>
                            <span style={{ color: 'var(--text-secondary)' }}>|</span>
                            <a href={equipmentData.mapLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-purple)', textDecoration: 'underline' }}>Sheet ↗</a>
                        </span>
                    </div>
                )}
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

ReactDOM.render(<App />, document.getElementById('root'));
