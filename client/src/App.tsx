import { 
  ArrowLeft, 
  ArrowRight, 
  Bookmark, 
  ChevronUp, 
  FolderOpen, 
  Grid3X3, 
  Home, 
  LayoutDashboard, 
  List, 
  LoaderCircle, 
  Menu, 
  Moon, 
  Scale, 
  Search, 
  Sun, 
  Trash2, 
  User 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnalysisTable } from './components/AnalysisTable';
import { LegalModal } from './components/LegalModal';
import { PrivacyNotice } from './components/PrivacyNotice';
import { UploadZone } from './components/UploadZone';
import { useAnalysis } from './hooks/useAnalysis';
import { useAuth } from './hooks/useAuth';
import type { LegalDoc, SavedMatterSummary } from './types';

function App() {
  const {
    contractName, 
    playbookName, 
    clauses, 
    results, 
    progress, 
    isAnalyzing, 
    setContractFile, 
    setPlaybookFile, 
    setContractName, 
    setPlaybookName,
    updateRedline,
    analyze, 
    loadDemo, 
    resetDemo,
  } = useAnalysis();

  const { user } = useAuth();
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'matters'>('workspace');
  const [selectedMatter, setSelectedMatter] = useState<SavedMatterSummary | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [matters, setMatters] = useState<SavedMatterSummary[]>([
    { id: 1, name: "NDA - Acme Corp", contract_name: "nda_acme.pdf", playbook_name: "playbook_legal_v3.json", retention_days: 14, delete_after: "2026-04-20T10:00:00Z", retain_source_files: true, created_at: "2026-04-01T10:00:00Z" },
    { id: 2, name: "Vendor MSA 2025", contract_name: "vendor_msa.docx", playbook_name: "standard_playbook.json", retention_days: 90, delete_after: "2026-07-15T10:00:00Z", retain_source_files: true, created_at: "2026-03-28T10:00:00Z" },
    { id: 3, name: "Partnership Agreement", contract_name: "partnership_agreement.pdf", playbook_name: "playbook_v2.json", retention_days: 30, delete_after: "2026-05-10T10:00:00Z", retain_source_files: false, created_at: "2026-03-15T10:00:00Z" },
  ]);

  // Dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const openLegal = async (kind: 'privacy' | 'terms') => {
    const response = await fetch(`/api/legal/${kind}`, { credentials: 'include' });
    const payload = await response.json();
    if (response.ok) setLegalDoc(payload);
  };

  const handleLoadMatter = (matter: SavedMatterSummary) => {
    setSelectedMatter(matter);
    setActiveTab('workspace');
    setContractName(matter.contract_name || '');
    setPlaybookName(matter.playbook_name || '');
    
    // Do NOT auto-run analysis when clicking a saved matter
  };

  const handleSaveMatter = () => {
    if (!contractName && !playbookName) return;
    
    const newMatter: SavedMatterSummary = {
      id: Date.now(),
      name: contractName ? contractName.split('.')[0].replace(/_/g, ' ') : 'Untitled Analysis',
      contract_name: contractName || '',
      playbook_name: playbookName || '',
      retention_days: 30,
      delete_after: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      retain_source_files: true,
      created_at: new Date().toISOString(),
    };
    
    setMatters(prev => [newMatter, ...prev]);
    setSelectedMatter(newMatter);
  };

  const handleDeleteMatter = (id: number) => {
    if (!confirm('Remove this matter?')) return;
    setMatters(prev => prev.filter(m => m.id !== id));
    if (selectedMatter?.id === id) setSelectedMatter(null);
  };

  const toggleSaved = (_id: number) => {
    // For now just visual - could be expanded later
    alert('Save state toggled (demo)');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-secondary)] text-[var(--text-primary)] font-sans">
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)] px-6 z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[var(--accent)] text-white">
              <Scale size={16} />
            </div>
            <span className="font-semibold tracking-tight">PlayBookRedline</span>
          </div>

          <div className="flex items-center rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5 text-sm">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-5 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'workspace' 
                  ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setActiveTab('matters')}
              className={`px-5 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'matters' 
                  ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Matters
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div 
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bg-tertiary)] cursor-pointer relative z-50"
          >
            <Menu size={18} />
          </div>
          
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-1 text-sm cursor-pointer">
            <div className="rounded-full bg-[var(--bg-tertiary)] p-1.5">
              <User size={15} />
            </div>
            <span className="font-medium pr-2">
              {user ? user.email.split('@')[0] : 'Guest'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[196px] border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
          <div className="pt-6 px-4">
            <div className="flex items-center gap-2 px-3 mb-8">
              <div className="h-6 w-6 bg-[var(--accent)] rounded flex items-center justify-center">
                <Scale size={14} className="text-white" />
              </div>
              <div className="text-xs font-semibold tracking-widest text-[var(--text-muted)]">PLAYBOOK</div>
            </div>

            <nav className="px-2 space-y-0.5">
              <div onClick={() => setActiveTab('workspace')}
                className={`flex items-center gap-3 px-4 py-[5px] text-[12px] rounded-lg cursor-pointer transition-all ${
                  activeTab === 'workspace' ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                }`}>
                <LayoutDashboard size={13} />
                Workspace
              </div>
              <div onClick={() => setActiveTab('matters')}
                className={`flex items-center gap-3 px-4 py-[5px] text-[12px] rounded-lg cursor-pointer transition-all ${
                  activeTab === 'matters' ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                }`}>
                <FolderOpen size={13} />
                Matters
              </div>
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 text-[10px] text-[var(--text-muted)] leading-tight">
              Documents are <span className="font-medium text-[var(--text-secondary)]">transient</span> unless you explicitly save a matter.
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col overflow-auto border-r border-[var(--border)] bg-[var(--bg-primary)]">
          {activeTab === 'workspace' ? (
            <div className="p-10 max-w-[1100px] mx-auto w-full">
              <div className="mb-10">
                <div className="uppercase text-[10px] tracking-[1px] font-semibold text-[var(--text-muted)]">CURRENT WORKSPACE</div>
                <h1 className="text-4xl font-semibold tracking-tighter text-[var(--text-primary)] mt-1">Contract Analysis</h1>
                <p className="mt-2 text-[var(--text-secondary)] text-[15px]">Upload a contract and playbook to generate AI-powered clause analysis and redlines.</p>
              </div>

              <PrivacyNotice onOpenPrivacy={() => openLegal('privacy')} onOpenTerms={() => openLegal('terms')} />

              <div className="mt-8 grid grid-cols-2 gap-8">
                <UploadZone 
                  label="CONTRACT" 
                  fileName={contractName} 
                  disabled={isAnalyzing}
                  onChange={(file) => { 
                    resetDemo(); 
                    setContractFile(file); 
                    setContractName(file?.name || ''); 
                  }} 
                />
                <UploadZone 
                  label="PLAYBOOK" 
                  fileName={playbookName} 
                  disabled={isAnalyzing}
                  onChange={(file) => { 
                    resetDemo(); 
                    setPlaybookFile(file); 
                    setPlaybookName(file?.name || ''); 
                  }} 
                />
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => void analyze()} 
                  disabled={isAnalyzing}
                  className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium py-4 rounded-2xl transition flex items-center justify-center gap-3 text-sm tracking-wider disabled:opacity-70"
                >
                  {isAnalyzing ? (
                    <><LoaderCircle className="animate-spin" size={18} /> RUNNING ANALYSIS...</>
                  ) : (
                    <>RUN ANALYSIS</>
                  )}
                </button>
                
                <button 
                  onClick={() => void loadDemo()} 
                  className="flex-1 border border-[var(--border)] hover:bg-[var(--bg-secondary)] font-medium py-4 rounded-2xl transition text-sm"
                >
                  LOAD SAMPLE DEMO
                </button>

                {results.length > 0 && (
                  <button 
                    onClick={handleSaveMatter}
                    className="px-8 border border-[var(--success)] text-[var(--success)] font-medium py-4 rounded-2xl hover:bg-[var(--success)] hover:text-white transition whitespace-nowrap"
                  >
                    SAVE MATTER
                  </button>
                )}
              </div>

              {progress && (
                <div className="mt-8">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-3">
                    <div>ANALYSIS PROGRESS</div>
                    <div>{progress.completed} of {progress.total} clauses</div>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--success)] rounded-full transition-all duration-300" 
                         style={{ width: `${Math.max(5, (progress.completed / progress.total) * 100)}%` }} />
                  </div>
                </div>
              )}

              {results.length > 0 && (
                <div className="mt-12">
                  <AnalysisTable 
                    clauses={clauses} 
                    results={results} 
                    onRedlineChange={updateRedline} 
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-12">
              <h2 className="text-3xl font-semibold mb-6">Saved Matters</h2>
              <div className="text-[var(--text-muted)]">Total: {matters.length} matters</div>
            </div>
          )}
        </div>

        {/* Right Explorer */}
        <div className="w-[340px] flex flex-col border-l border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
          {/* Toolbar */}
          <div className="h-12 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center px-3 gap-2">
            <button className="w-7 h-7 flex items-center justify-center hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]">
              <ArrowLeft size={15} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]">
              <ArrowRight size={15} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]">
              <ChevronUp size={15} />
            </button>

            <div className="flex-1 mx-3 relative">
              <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={14} />
              <input 
                type="text" 
                placeholder="Search matters..." 
                className="w-full pl-9 bg-[var(--bg-tertiary)] border border-transparent focus:border-[var(--border)] h-9 rounded-lg text-sm placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>

            <div className="flex border border-[var(--border)] rounded-md overflow-hidden">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 transition-colors ${viewMode === 'list' ? 'bg-[var(--bg-primary)]' : 'bg-transparent text-[var(--text-muted)]'}`}
              >
                <List size={15} />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 transition-colors ${viewMode === 'grid' ? 'bg-[var(--bg-primary)]' : 'bg-transparent text-[var(--text-muted)]'}`}
              >
                <Grid3X3 size={15} />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="h-9 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center px-4 text-[11px] text-[var(--text-muted)] gap-1">
            <Home size={13} /> <span className="mx-1">›</span>
            <span>Matters</span> <span className="mx-1">›</span>
            <span className="font-medium text-[var(--text-primary)]">All ({matters.length})</span>
          </div>

          {/* Column Headers */}
          {viewMode === 'list' && (
            <div className="h-9 bg-[var(--bg-tertiary)] border-b border-[var(--border)] flex items-center text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] px-4">
              <div className="flex-1">NAME</div>
              <div className="w-[92px]">MODIFIED</div>
              <div className="w-[78px]">RETENTION</div>
            </div>
          )}

          {/* File List */}
          <div className={`flex-1 overflow-auto py-1 ${viewMode === 'grid' ? 'p-4 grid grid-cols-2 gap-4' : ''}`}>
            {matters.map((matter) => (
              <div 
                key={matter.id}
                onClick={() => handleLoadMatter(matter)}
                className={`group flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-tertiary)] border-l-2 border-transparent ${
                  selectedMatter?.id === matter.id ? 'bg-blue-50 border-blue-500 dark:bg-blue-950' : ''
                } ${viewMode === 'grid' ? 'flex-col items-start h-32 w-full border border-[var(--border)] rounded-xl p-3' : ''}`}
              >
                {/* Icon */}
                <div className="relative w-8 h-8 flex-shrink-0">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="6" width="24" height="22" rx="2" fill="var(--file-pdf)" />
                    <path d="M28 6 L28 12 L22 6 L28 6 Z" fill="#991b1b" />
                    <text x="10" y="23" fill="white" fontSize="7.5" fontWeight="700">PDF</text>
                  </svg>
                </div>

                <div className={viewMode === 'grid' ? 'mt-2 text-center w-full' : 'flex-1 min-w-0'}>
                  <div className="font-medium text-sm truncate">{matter.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{new Date(matter.created_at).toLocaleDateString()}</div>
                </div>

                {viewMode === 'list' && (
                  <div className="text-xs px-3 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">
                    {matter.retention_days}d
                  </div>
                )}

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); toggleSaved(matter.id); }} className="p-1 hover:text-amber-500">
                    <Bookmark size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteMatter(matter.id); }} className="p-1 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Status Bar */}
          <div className="h-8 border-t border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center px-4 text-[10px] text-[var(--text-muted)]">
            <div className="flex-1">{matters.length} items</div>
            <div className="text-right truncate max-w-[160px]">
              {selectedMatter ? selectedMatter.name : 'No matter selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Hamburger Menu */}
      {showMenu && (
        <div 
          className="absolute top-16 right-8 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-xl p-2 z-[100] w-64"
          onClick={(e) => e.stopPropagation()}
        >
          <div onClick={toggleDarkMode} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)] rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              <span>Appearance</span>
            </div>
            <div className={`w-9 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-4' : 'left-0.5'}`} />
            </div>
          </div>
          
          <div className="h-px bg-[var(--border)] my-1 mx-2"></div>
          
          <div 
            onClick={() => { setShowMenu(false); alert('Admin Center - Coming soon'); }} 
            className="px-4 py-2.5 hover:bg-[var(--bg-secondary)] rounded-lg cursor-pointer text-[var(--text-secondary)]"
          >
            Admin Center
          </div>
          <div 
            onClick={() => { setShowMenu(false); alert('Account Settings - Coming soon'); }} 
            className="px-4 py-2.5 hover:bg-[var(--bg-secondary)] rounded-lg cursor-pointer text-[var(--text-secondary)]"
          >
            Account Settings
          </div>
          <div 
            onClick={() => { setShowMenu(false); alert('Keyboard Shortcuts'); }} 
            className="px-4 py-2.5 hover:bg-[var(--bg-secondary)] rounded-lg cursor-pointer text-[var(--text-secondary)]"
          >
            Keyboard Shortcuts
          </div>
          <div 
            onClick={() => { setShowMenu(false); window.location.reload(); }} 
            className="px-4 py-2.5 hover:bg-[var(--bg-secondary)] rounded-lg cursor-pointer text-red-500"
          >
            Sign Out
          </div>
        </div>
      )}

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}

export default App;
