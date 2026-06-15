import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace renderMainContent block
# We find the definition of renderMainContent and replace it with the routes.
start_str = "const renderMainContent = () => {"

new_render = """
  const location = useLocation();
  const isHomeSection = location.pathname === '/';
  const { sidebarOpen, setSidebarOpen } = useUI();
"""

routes_block = """
              <Routes>
                <Route path="/" element={
                  <HomePage 
                    cards={cards}
                    userName={userName}
                    onSearch={(query) => {
                      setSearchQuery(query);
                      navigate('/browse');
                    }}
                    onStartBrowsing={() => {
                      setViewMode('grid');
                      navigate('/browse');
                    }}
                    onStartBrowsingList={() => {
                      setViewMode('list');
                      navigate('/browse');
                    }}
                    onStartReviewSession={openDueReviewSession}
                    onAddCard={() => setAddDataMode('create')}
                    onBatchImport={() => setAddDataMode('import')}
                    onBackgroundExport={handleExportBackup}
                    onSettings={() => navigate('/settings')}
                  />
                } />
                <Route path="/browse" element={
                  <BrowsePage 
                    renderNetworkView={() => (
                      <Suspense fallback={<LoadingFallback />}>
                        <NetworkView
                          cards={filteredCards}
                          onNodeClick={(id) => {
                            if (networkPanelPinned) {
                              setPinnedCardId(id);
                            }
                            setSelectedCardId(id);
                          }}
                          searchQuery={searchQuery}
                          highlightedIds={searchResultIds ? new Set(searchResultIds) : undefined}
                          activeFilters={activeFilters}
                          onSuppressConnections={handleSuppressConnections}
                          semanticReady={embeddingsReady}
                          vetoPairs={getLinkFeedback().vetoPairs}
                          typeCompat={getLinkFeedback().typePairScores}
                          activeNodeId={selectedCard?.id}
                          pendingClusterReview={pendingClusterReview}
                          onStartClusterReview={(clusterNodeIds) => {
                              setPendingClusterReview(false);
                              if (clusterNodeIds.length === 0) return;
                              setReviewSession({
                                  cardIds: clusterNodeIds,
                                  title: 'Révision par Cluster'
                              });
                          }}
                        />
                      </Suspense>
                    )}
                    networkPanelCard={networkPanelCard}
                    onNetworkPanelClose={() => setPinnedCardId(null)}
                    networkPanelPinned={networkPanelPinned}
                    onNetworkPanelPinToggle={() => setNetworkPanelPinned(!networkPanelPinned)}
                  />
                } />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/review" element={
                    <ReviewHubPage 
                        onSelectFSRS={startFSRSReview}
                        onSelectCluster={startClusterReviewMode}
                        onSelectIntensive={startIntensiveReview}
                        totalDue={cards.filter(c => c.srsData && isCardDue(c.srsData) && c.type !== COURSE_TYPE).length}
                        hasEnoughCardsForCluster={cards.filter(c => c.type !== COURSE_TYPE).length >= 5}
                    />
                } />
                <Route path="/network" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <NetworkView
                          cards={filteredCards}
                          onNodeClick={(id) => {
                            if (networkPanelPinned) {
                              setPinnedCardId(id);
                            }
                            setSelectedCardId(id);
                          }}
                          searchQuery={searchQuery}
                          highlightedIds={searchResultIds ? new Set(searchResultIds) : undefined}
                          activeFilters={activeFilters}
                          onSuppressConnections={handleSuppressConnections}
                          semanticReady={embeddingsReady}
                          vetoPairs={getLinkFeedback().vetoPairs}
                          typeCompat={getLinkFeedback().typePairScores}
                          activeNodeId={selectedCard?.id}
                          pendingClusterReview={pendingClusterReview}
                          onStartClusterReview={(clusterNodeIds) => {
                              setPendingClusterReview(false);
                              if (clusterNodeIds.length === 0) return;
                              setReviewSession({
                                  cardIds: clusterNodeIds,
                                  title: 'Révision par Cluster'
                              });
                          }}
                        />
                      </Suspense>
                } />
              </Routes>
"""

# Replace renderMainContent
content = re.sub(r'const renderMainContent = \(\) => \{.*?\};\n\n      <Sidebar', new_render + '\n      <Sidebar', content, flags=re.DOTALL)

# Replace {renderMainContent()} with routes block
content = content.replace('{renderMainContent()}', routes_block)

# Also fix the header usages of activeSection (replace with location.pathname)
content = content.replace('activeSection !== \'cards\' && activeSection !== \'network\'', 'location.pathname !== \'/browse\' && location.pathname !== \'/network\'')
content = content.replace("setActiveSection('cards');", "navigate('/browse');")
content = content.replace("activeSection !== 'courses'", "location.pathname !== '/courses'")

# Finally, write the file
with open('src/App.tsx', 'w') as f:
    f.write(content)
