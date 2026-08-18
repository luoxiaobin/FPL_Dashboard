export interface FplImportProbe {
  schemaVersion: 0;
  entryId: number;
  pickCount: number;
  captainCount: number;
  viceCaptainCount: number;
  hasBank: boolean;
  capturedAt: string;
}

const encodeBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const decodeBase64Url = (value: string): string => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0)));
};

export function encodeFplImportProbe(probe: FplImportProbe): string {
  return encodeBase64Url(JSON.stringify(probe));
}

export function decodeFplImportProbe(encoded: string): FplImportProbe {
  const candidate = JSON.parse(decodeBase64Url(encoded)) as Partial<FplImportProbe>;
  if (
    candidate.schemaVersion !== 0
    || !Number.isInteger(candidate.entryId) || Number(candidate.entryId) <= 0
    || !Number.isInteger(candidate.pickCount) || Number(candidate.pickCount) < 0
    || !Number.isInteger(candidate.captainCount) || Number(candidate.captainCount) < 0
    || !Number.isInteger(candidate.viceCaptainCount) || Number(candidate.viceCaptainCount) < 0
    || typeof candidate.hasBank !== 'boolean'
    || typeof candidate.capturedAt !== 'string'
    || Number.isNaN(Date.parse(candidate.capturedAt))
  ) {
    throw new Error('The FPL probe payload is invalid');
  }
  return candidate as FplImportProbe;
}

export function buildFplProbeBookmarklet(dashboardOrigin: string): string {
  const targetUrl = `${dashboardOrigin.replace(/\/$/, '')}/planning/import/probe`;
  const script = `(async()=>{let w;try{w=window.open('about:blank','_blank');if(!w)throw new Error('Allow pop-ups for fantasy.premierleague.com and try again');const m=await fetch('/api/me/',{credentials:'include'});if(!m.ok)throw new Error('Sign in to FPL first');const j=await m.json();const e=j?.player?.entry??j?.entry;if(!Number.isInteger(e)||e<=0)throw new Error('No FPL entry was found');const r=await fetch('/api/my-team/'+e+'/',{credentials:'include'});if(!r.ok)throw new Error('FPL did not return your current team');const t=await r.json();const p=Array.isArray(t?.picks)?t.picks:[];const s={schemaVersion:0,entryId:e,pickCount:p.length,captainCount:p.filter(x=>x?.is_captain===true).length,viceCaptainCount:p.filter(x=>x?.is_vice_captain===true).length,hasBank:Number.isFinite(t?.transfers?.bank),capturedAt:new Date().toISOString()};const b=new TextEncoder().encode(JSON.stringify(s));let q='';for(const x of b)q+=String.fromCharCode(x);const d=btoa(q).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/g,'');w.location.href='${targetUrl}#data='+d}catch(e){if(w)w.close();alert('FPL Dashboard import probe: '+(e?.message||'Unable to read team'))}})()`;
  return `javascript:${script}`;
}
