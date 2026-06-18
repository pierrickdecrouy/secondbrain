import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

# 1. Move location = useLocation()
code = code.replace("  const location = useLocation();\n", "")
code = code.replace("const navigate = useNavigate();\n", "const navigate = useNavigate();\n  const location = useLocation();\n")

# 2. Fix isNetworkContext
code = code.replace("const isNetworkContext = activeSection === 'network' || (activeSection === 'cards' && viewMode === 'network');", "const isNetworkContext = location.pathname === '/network';")

# 3. Add CardSidePanel to /network route
target_route = """                <Route path="/network" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <NetworkView"""

replacement_route = """                <Route path="/network" element={
                    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Suspense fallback={<LoadingFallback />}>
                            <NetworkView"""

code = code.replace(target_route, replacement_route)

# Now close the div and add CardSidePanel after NetworkView in the /network route
target_close = """                              setReviewSession({
                                  cardIds: clusterNodeIds,
                                  title: 'Révision par Cluster'
                              });
                          }}
                        />
                      </Suspense>
                } />"""

replacement_close = """                              setReviewSession({
                                  cardIds: clusterNodeIds,
                                  title: 'Révision par Cluster'
                              });
                          }}
                        />
                      </Suspense>
                      </div>
                      {selectedCard && (
                          <div style={{
                              position: 'absolute',
                              top: 0, right: 0, bottom: 0, width: '400px',
                              backgroundColor: 'var(--color-bg-base)',
                              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
                              zIndex: 100,
                              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              borderLeft: '1px solid var(--border-light)',
                              display: 'flex', flexDirection: 'column'
                          }}>
                              <CardSidePanel
                                  card={selectedCard}
                                  allCards={cards}
                                  onClose={() => setSelectedCardId(null)}
                                  onPinToggle={() => setNetworkPanelPinned(!networkPanelPinned)}
                                  pinned={networkPanelPinned}
                                  onLinkClick={(id) => {
                                      if (networkPanelPinned) setPinnedCardId(id);
                                      setSelectedCardId(id);
                                  }}
                              />
                          </div>
                      )}
                    </div>
                } />"""

code = code.replace(target_close, replacement_close)

# make sure CardSidePanel is imported in App.tsx
if "import { CardSidePanel }" not in code:
    code = code.replace("import { DetailModal } from './components/DetailModal';", "import { DetailModal } from './components/DetailModal';\nimport { CardSidePanel } from './components/CardSidePanel';")

with open('src/App.tsx', 'w') as f:
    f.write(code)

