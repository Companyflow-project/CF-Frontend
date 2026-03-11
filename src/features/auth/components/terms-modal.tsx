import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TermsModalProps {
    open: boolean;
    onClose: () => void;
    /** Called when the user clicks Luk after reading to the bottom — auto-ticks the checkbox */
    onAccept?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ open, onClose, onAccept }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasReadAll, setHasReadAll] = useState(false);
    const { t } = useTranslation('auth');

    // Reset every time the modal is opened so short-cutting isn't possible
    useEffect(() => {
        if (open) {
            setHasReadAll(false);
            // Small delay to let the DOM render, then check if content fits without scrolling
            setTimeout(() => {
                const el = scrollRef.current;
                if (el && el.scrollHeight <= el.clientHeight) {
                    setHasReadAll(true); // Content fits — no scroll needed
                }
            }, 50);
        }
    }, [open]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        // 8px tolerance so it triggers just before the very last pixel
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
            setHasReadAll(true);
        }
    };

    // Escape closes without accepting
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    const handleLuk = () => {
        onAccept?.();
        onClose();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-labelledby="terms-title"
        >
            {/* Panel */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-[#e5e7eb] flex-shrink-0">
                    <h2 id="terms-title" className="text-xl font-bold text-[#1a5948]">
                        {t('terms.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label={t('terms.closeAria')}
                        className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scroll-to-read hint */}
                {!hasReadAll && (
                    <div className="flex items-center justify-center gap-1.5 py-2 bg-[#fffbeb] border-b border-[#fde68a] text-[12px] text-[#92400e] flex-shrink-0">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {t('terms.scrollHint')}
                    </div>
                )}

                {/* Scrollable body — legal content stays in Danish regardless of language */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="overflow-y-auto px-8 py-6 text-sm text-[#374151] leading-relaxed space-y-4 flex-1"
                >
                    <h3 className="font-semibold text-[#111827]">Abonnementsvilkår</h3>
                    <p className="text-xs text-[#6b7280]">Senest opdateret september 2025.</p>

                    <p>
                        Kundens abonnement hos CompanyFlow er underlagt disse abonnementsvilkår, som kunden skal
                        acceptere i forbindelse med oprettelse som bruger af abonnementet.
                    </p>

                    <h4 className="font-medium text-[#111827]">Kontaktinformationer</h4>
                    <p>
                        Abonnementet udbydes og ejes af CompanyFlow, som har følgende kontaktoplysninger:
                    </p>
                    <p>
                        CompanyFlow
                        <br />
                        CVR-nr.: 42562254
                        <br />
                        Adresse: Lunavej 6, 4700 Næstved
                        <br />
                        E-mail:{' '}
                        <a href="mailto:info@degoan.dk" className="text-[#1a5948] underline">
                            info@degoan.dk
                        </a>
                    </p>
                    <p>
                        Kunden er altid velkommen til at kontakte CompanyFlow, hvis der er spørgsmål til
                        abonnementsvilkårene eller abonnementet generelt.
                    </p>

                    <h4 className="font-medium text-[#111827]">Accept af abonnement</h4>
                    <p>
                        Abonnementsvilkårene accepteres ved fakturering af kunden, hvorefter abonnementet åbnes.
                    </p>

                    <h4 className="font-medium text-[#111827]">Ændring i abonnementsvilkår</h4>
                    <p>
                        CompanyFlow har til enhver tid ret til at ændre abonnementsvilkårene. I tilfælde af væsentlige
                        ændringer vil kunden blive varslet minimum en måned inden, at ændringerne træder i kraft. De
                        gældende abonnementsvilkår kan altid ses på degoan.dk.
                    </p>

                    <h4 className="font-medium text-[#111827]">Behandling af persondata (GDPR-regler)</h4>
                    <p>
                        CompanyFlow er at betragte som databehandler i brugen af kundens data. Det er kunden selv, der
                        er dataansvarlig. Degoan.dk indsamler og behandler data, som er nødvendige for at kunne levere
                        ydelser til kunden, som har købt adgang til CompanyFlows personalehåndbog.
                    </p>
                    <p>
                        CompanyFlow registrerer virksomheds- og personoplysninger. Det drejer sig om navne, mailadresser,
                        telefonnumre samt forskellige andre oplysninger om kunden, som er indtastet i systemet.
                        Kundens medarbejdere godtager indirekte indsamlingen af deres personlige oplysninger.
                        Indsamlingen af personoplysninger for medarbejderne er fundamental for, at CompanyFlow kan
                        levere sine ydelser til kunden.
                    </p>
                    <p>
                        Uden disse oplysninger er CompanyFlow ikke i stand til at opfylde aftalen, som indgås, og kan
                        ikke levere sin ydelse som aftalt. CompanyFlow indsamler de oplysninger, som kunden selv
                        udleverer ved indgåelsen af aftalen, samt oplysninger om brugernes brug af systemet. Dette er
                        en central og nødvendig del af CompanyFlows ydelse.
                    </p>
                    <p>
                        Kunden er selv ansvarlig for, at disse data er korrekte, og CompanyFlow har ingen pligt (eller
                        mulighed) for at sikre dette. På samme måde kan CompanyFlow heller ikke sikre, at der ikke
                        forekommer fortrolig information i kundens håndbog. Dette er alene virksomhedens eget ansvar.
                    </p>
                    <p>
                        CompanyFlow indsamler informationer via cookies for at kunne tilpasse brugeroplevelsen på
                        degoan.dk og for at kunne optimere produktet. Se mere herom i CompanyFlows cookiepolitik
                        nederst på siden.
                    </p>
                    <p>
                        Disse data opbevares, så længe kunden har en konto hos CompanyFlow, og er kun tilgængelige for
                        medarbejdere i CompanyFlow og kunden selv. Ingen oplysninger deles med tredjepart.
                    </p>
                    <p>
                        Kunden har ret til at se, rette og slette sine egne data og til at gøre indsigelser mod CompanyFlows
                        behandling af data. Den enkelte bruger/medarbejder har ikke direkte disse rettigheder,
                        men skal gå gennem sin virksomhed for at håndhæve sine rettigheder i henhold til GDPR.
                    </p>
                    <p>
                        Hvis der er andre indsigelser mod CompanyFlows behandling af data, eller hvis der ønskes
                        adgang til de oplysninger, som er registreret om kunden og medarbejderne hos CompanyFlow, eller
                        hvis de ønskes ændret, eksporteret eller slettet, kan det ske ved henvendelse til Kim Conrad
                        Petersen:{' '}
                        <a href="mailto:kim@degoan.dk" className="text-[#1a5948] underline">
                            kim@degoan.dk
                        </a>
                        .
                    </p>
                    <p>
                        Der er mulighed for at klage over CompanyFlows behandling af oplysningerne, hvis CompanyFlow
                        ikke er enig i indsigelserne. Klagen skal sendes til Datatilsynet. Se mere hos Datatilsynet.
                    </p>

                    <h4 className="font-medium text-[#111827]">CompanyFlow beskytter alle data</h4>
                    <p>
                        CompanyFlow gemmer oplysningerne på computere (servere) med begrænset adgang. CompanyFlows
                        sikkerhedsforanstaltninger kontrolleres løbende for at sikre, at oplysninger håndteres
                        forsvarligt og under stadig hensyntagen til kundens rettigheder. CompanyFlow foretager alle
                        nødvendige sikkerhedsforanstaltninger og holder softwaren opdateret med henblik på at forhindre
                        sikkerhedshuller eller -brud.
                    </p>
                    <p>
                        CompanyFlow kan ikke garantere 100 procent sikkerhed ved dataoverførsler via internettet. Det
                        betyder, at der kan være en risiko for, at andre uberettiget tiltvinger sig adgang til
                        oplysninger, når data sendes og opbevares elektronisk. Der afgives således personlige
                        oplysninger på eget ansvar. CompanyFlow forpligter sig til at informere ved eventuelle brud på
                        sikkerheden, som CompanyFlow får kendskab til.
                    </p>
                    <p>
                        CompanyFlow ændrer løbende sin behandling af oplysninger i takt med udviklingen af produkter og
                        relevante teknologier. CompanyFlow forbeholder sig derfor ret til at opdatere og ændre dette
                        dokument. Gør CompanyFlow det, rettes datoen for &quot;senest opdateret&quot;. I tilfælde af
                        væsentlige ændringer gives kunden besked i form af en synlig meddelelse på CompanyFlows
                        website eller en e-mail.
                    </p>

                    <h4 className="font-medium text-[#111827]">Cookiepolitik</h4>
                    <p>
                        Læs vores separate dokument om privatlivspolitik, persondatabehandling og cookiepolitik for
                        nærmere information.
                    </p>

                    <h4 className="font-medium text-[#111827]">Abonnementets indhold</h4>
                    <p>
                        CompanyFlow har på forhånd skrevet 80-90% af de tekster, som en almindelig personalehåndbog
                        indeholder. Tilbage står de tekster, der er unikke for virksomheden – eksempelvis historie,
                        værdier, vision, mission osv. Alle CompanyFlows tekster kan vælges fra og erstattes af egne tekster.
                    </p>
                    <p>
                        Overenskomster og lokalaftaler indgår ikke i de tekster eller emner, som CompanyFlow har skrevet
                        på forhånd. Teksterne i CompanyFlows personalehåndbog kan oversættes til andre sprog. CompanyFlow
                        garanterer ikke for fejloversættelser mv.
                    </p>

                    <h4 className="font-medium text-[#111827]">Er indholdet juridisk korrekt?</h4>
                    <p>
                        Alle CompanyFlows tekster i personalehåndbogen bliver gennemlæst og tjekket af CompanyFlows advokat. Det
                        betyder, at CompanyFlow står inde for, at indholdet i CompanyFlows tekster er korrekt i forhold til dansk
                        lovgivning.
                    </p>
                    <p>
                        Det er væsentligt at være opmærksom på, at CompanyFlow ikke står inde for de tekster, som en
                        abonnerende virksomhed selv lægger op. Det gælder også for tekster, der tager udgangspunkt i
                        CompanyFlows tekster, men som er blevet rettet til af virksomheden – uanset hvor lidt eller hvor
                        meget, der er rettet til i forhold til CompanyFlows oprindelige tekst.
                    </p>
                    <p>
                        CompanyFlow holder sig orienteret om nye tiltag – lovgivning mv. – som kommer fra offentlige
                        myndigheder. Ændringer bliver straks skrevet ind i CompanyFlows tekster, og de abonnerende
                        virksomheder bliver orienteret pr. mail. Ovennævnte gælder også for oversatte varianter, fx
                        engelsk, af CompanyFlows personalehåndbog.
                    </p>

                    <h4 className="font-medium text-[#111827]">Brugen af abonnementet</h4>
                    <p>
                        Abonnementet giver kunden og kundens medarbejdere adgang til at tilgå abonnementets indhold i
                        abonnementsperioden og bruge det inden for de begrænsninger for bl.a. antal licenser, der gælder
                        for det specifikke produkt til enhver tid. Abonnementet dækker alle ansatte i kundens
                        virksomhed – ledere, fuldtidsansatte, deltids- og timeansatte mv.
                    </p>
                    <p>
                        Adgangen til abonnementet og dets indhold gælder udelukkende medarbejdere og eventuelle
                        rådgivere. Abonnementet og dets indhold må ikke anvendes af andre og må ikke videresælges til
                        andre. Kunden står inde for og har det fulde ansvar for alle, som kunden giver adgang til
                        abonnementets indhold, eller som bruger kundens login.
                    </p>
                    <p>
                        Kunden har pligt til at sikre sig, at abonnementet ikke bliver anvendt i strid med gældende
                        lovgivning eller på en måde, som kan skade CompanyFlows omdømme. Hvis kunden får kendskab
                        til, at abonnementsadgangen er blevet anvendt i strid med disse abonnementsvilkår, gældende
                        lovgivning eller på anden måde, der kan skade CompanyFlows omdømme, er kunden forpligtet til
                        straks skriftligt at underrette CompanyFlow herom.
                    </p>

                    <h4 className="font-medium text-[#111827]">Opdatering</h4>
                    <p>
                        CompanyFlow foretager opdatering af teknik, software, servere mv., som driver CompanyFlows
                        platforme. CompanyFlow opdaterer hele tiden de tekster, som er skrevet på forhånd af CompanyFlow,
                        i forhold til ny lovgivning og retningslinjer.
                    </p>
                    <p>
                        Tekster, tilføjelser og andet, som er skrevet og uploadet af kunden, skal kunden selv sørge for
                        at opdatere. Indhold i kundens egne tekster er ikke underlagt CompanyFlows ansvar.
                    </p>

                    <h4 className="font-medium text-[#111827]">Support</h4>
                    <p>CompanyFlow yder support på sin egen platform:</p>
                    <ul className="list-disc list-inside space-y-1 text-[#374151]">
                        <li>Vi kan svare på enkle spørgsmål om opbygning, valg af tekster og lignende.</li>
                        <li>Vi kan i et vist omfang yde hjælp til det indhold, man selv vælger at skrive.</li>
                        <li>
                            For spørgsmål om jura og HR samt overenskomster og andre aftaler må man henvende sig til
                            brancheforening eller advokat.
                        </li>
                    </ul>

                    <h4 className="font-medium text-[#111827]">Ophavsret og immaterielle rettigheder</h4>
                    <p>
                        Abonnementets indhold og design er beskyttet af ophavsret, varemærkeret og andre immaterielle
                        rettigheder, der tilhører CompanyFlow. Tilsvarende ejer CompanyFlow alle immaterielle rettigheder,
                        der eksisterer eller måtte opstå som led i CompanyFlows opfyldelse af aftalen, herunder
                        enhver form for kilde- og objektkode mv.
                    </p>
                    <p>
                        Kunden er ikke berettiget til at ændre eller fjerne mærker eller meddelelser vedrørende
                        immaterielle rettigheder, der er anvendt eller fremgår af abonnementets indhold. Kunden skal
                        straks skriftligt give CompanyFlow meddelelse om enhver krænkelse eller potentiel krænkelse af
                        CompanyFlows immaterielle rettigheder.
                    </p>
                    <p>
                        CompanyFlow overdrager kunden en ikke-overdragelig og ikke-eksklusiv brugsret til at tilgå
                        abonnementets indhold i overensstemmelse med disse vilkår. Der er ikke overdraget andre
                        rettigheder.
                    </p>
                    <p>
                        Virksomhedens egne tekster er beskyttet af rettighedslovgivningen, og CompanyFlow har
                        tavshedspligt, hvad indholdet angår i en virksomheds personalehåndbog. CompanyFlow kan ikke
                        bruge eller overføre indhold fra en virksomheds personalehåndbog til en anden. Det er
                        virksomhedens eget ansvar, hvis der i personalehåndbogen skrives koder til alarmer,
                        it-systemer mv.
                    </p>

                    <h4 className="font-medium text-[#111827]">Betaling</h4>
                    <p>
                        Betaling sker ved bestillingen efter fremsendt faktura, og første abonnementsperiode løber fra
                        bestillingsdatoen og en måned, et kvartal eller et år frem. Herefter betales månedsvis,
                        kvartalsvis eller årsvis forud, medmindre andet følger af aftalen eller vilkårene for det
                        specifikke produkt.
                    </p>
                    <p>
                        Abonnementet fortsætter, indtil det opsiges med 2 måneders varsel til udgangen af en
                        abonnementsperiode, og betaling sker efter fakturering, inden den nye abonnementsperiode
                        begynder.
                    </p>
                    <p>
                        Kunden kan til enhver tid finde gældende priser på CompanyFlows hjemmeside. CompanyFlow tager
                        forbehold for tryk- og prisfejl. Alle priser er angivet i danske kroner (DKK) og er eksklusiv
                        moms, skatter og afgifter. Kunden skal betale den til enhver tid gældende moms, skatter og
                        afgifter.
                    </p>
                    <p>
                        CompanyFlow har ret til at ændre prisen med en måneds varsel til udgangen af et kvartal. Det
                        samme gør sig gældende for ændringer i abonnementet.
                    </p>
                    <p>
                        CompanyFlow sælger licenser i bundter af 5 (5, 10, 15, 20, 25 osv.). Man råder over det antal
                        licenser, som man har betalt for. Hvis en medarbejder forlader virksomheden, slettes
                        vedkommende, og licensen kan overgå til en anden medarbejder. CompanyFlow gemmer data om den
                        slettede medarbejder i 3 måneder, hvorefter de slettes.
                    </p>
                    <p>
                        Hvis man behøver flere licenser, bestiller man dem hos CompanyFlow via
                        virksomhedsadministratorens side. Flere licenser betales forholdsmæssigt for resten af
                        abonnementsperioden. Ved fortsættelse af abonnementet lægges de nye licenser sammen med de
                        oprindelige og løber i den næste periode.
                    </p>
                    <p>
                        Til hver licens hører 5 SMS&apos;er. SMS&apos;er kan bruges til at give medarbejdere besked om
                        udgivelse af personalehåndbogen, opdateringer mv. Det er muligt at købe flere licenser. Hvis
                        man ønsker at nedgradere antallet af licenser, kan det ske med udgangen af en
                        abonnementsperiode.
                    </p>

                    <h4 className="font-medium text-[#111827]">Varighed</h4>
                    <p>
                        Abonnementet træder i kraft ved bestilling og betaling pr. faktura og varer, indtil det opsiges
                        i overensstemmelse med disse abonnementsvilkår.
                    </p>

                    <h4 className="font-medium text-[#111827]">Opsigelse og misligholdelse</h4>
                    <p>
                        Kunden kan opsige sit abonnement i applikationen senest 2 måneder før udløbet af en
                        abonnementsperiode. Hvis dette ikke sker, vil der automatisk blive faktureret for en ny
                        abonnementsperiode.
                    </p>
                    <p>
                        CompanyFlow kan opsige abonnementet med 6 måneders varsel til udløbet af et kalenderkvartal. I
                        tilfælde af kundens misligholdelse, konkurs eller insolvens kan CompanyFlow opsige kundens
                        abonnement uden varsel.
                    </p>

                    <h4 className="font-medium text-[#111827]">Driftsstabilitet</h4>
                    <p>
                        CompanyFlow tilstræber højest mulig driftsstabilitet, men fraskriver sig alt ansvar ved nedbrud
                        eller driftsforstyrrelser, inklusiv driftsforstyrrelser forårsaget af faktorer uden for CompanyFlows
                        kontrol, fx internetforbindelse og strømsvigt.
                    </p>
                    <p>
                        Applikationen og servicen leveres, som den er, og CompanyFlow garanterer ikke for tilgængelighed
                        og funktionalitet. CompanyFlow fraskriver sig i videst muligt omfang enhver garanti, tilsikring,
                        indeståelse, anprisning eller andre vilkår, uanset direkte eller indirekte. Ved nedbrud vil
                        CompanyFlow bestræbe sig på at genskabe normal drift hurtigst muligt.
                    </p>
                    <p>
                        Planlagte afbrydelser vil fortrinsvis blive placeret i tidsrummet 22–02. Skulle det blive
                        nødvendigt at afbryde adgangen uden for tidsrummet, vil CompanyFlow så vidt muligt varsle kunden
                        herom.
                    </p>

                    <h4 className="font-medium text-[#111827]">CompanyFlows ansvar</h4>
                    <p>
                        CompanyFlow fraskriver sig i videst muligt omfang ethvert ansvar i relation til disse vilkår,
                        services eller brug af abonnementet. CompanyFlow er ikke ansvarlig og hæfter ikke for nogen form
                        for skader eller tab, herunder men ikke begrænset til direkte og indirekte tab, som følge af at
                        abonnementet indeholder fejl eller er ufuldstændigt, uanset at CompanyFlow måtte være gjort
                        bekendt med risikoen for sådanne skader eller tab.
                    </p>
                    <p>
                        Abonnementets indhold eller anden kommunikation med CompanyFlow udgør ikke juridisk rådgivning,
                        og CompanyFlow indestår ikke for, at abonnementets indhold ved anvendelse lever op til gældende
                        lovgivning.
                    </p>
                    <p>
                        Uanset typen af tab eller ansvarsgrundlag er CompanyFlows samlede ansvar beløbsmæssigt
                        begrænset til beløbet for din betaling i 12 måneder før det ansvarspådragende forholds
                        indtræden, dog i alle tilfælde maksimalt DKK 10.000. Kunden accepterer at skadesløsholde
                        CompanyFlow mod ethvert krav eller tab, der skyldes produktansvar, tredjemandstab eller øvrige
                        krav fra tredjemand, i det omfang det hidrører fra kundens brug af abonnementet.
                    </p>

                    <h4 className="font-medium text-[#111827]">Reklamation</h4>
                    <p>
                        Ved fejl eller mangler kan kunden kontakte CompanyFlow på{' '}
                        <a href="mailto:info@degoan.dk" className="text-[#1a5948] underline">
                            info@degoan.dk
                        </a>
                        . Kunden er selv ansvarlig for, at alle tekniske krav og øvrige forudsætninger for brug af
                        abonnementet er opfyldt, herunder at kunden benytter udstyr, der er kompatibelt med
                        abonnementet. Fejl på kundens tekniske udstyr er CompanyFlow uvedkommende.
                    </p>

                    <h4 className="font-medium text-[#111827]">Overdragelse</h4>
                    <p>
                        CompanyFlow har ret til uden forudgående samtykke at overdrage sine rettigheder og forpligtelser
                        over for kunden til et koncernforbundet selskab eller tredjemand. Kunden accepterer, at CompanyFlow
                        er berettiget til at anvende underleverandører i alle forhold, herunder til afvikling og
                        drift af applikationen samt til opbevaring af data.
                    </p>

                    <h4 className="font-medium text-[#111827]">Lovvalg og værneting</h4>
                    <p>
                        Denne aftale er underlagt og skal fortolkes i overensstemmelse med dansk ret, idet der ses bort
                        fra lovvalgsregler, der måtte føre til anvendelse af et andet lands lov. Eventuelle tvister kan
                        søges løst ved de almindelige danske domstole.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-8 py-5 border-t border-[#e5e7eb] flex-shrink-0">
                    <p className="text-xs text-[#9ca3af]">
                        {hasReadAll
                            ? t('terms.readComplete')
                            : t('terms.scrollToActivate')}
                    </p>
                    <Button
                        onClick={handleLuk}
                        disabled={!hasReadAll}
                        className={`rounded-[999px] px-8 h-10 text-[13.5px] transition-colors ${hasReadAll
                                ? 'bg-[#1a5948] hover:bg-[#143e33] active:bg-[#0f2e26] text-white'
                                : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                            }`}
                    >
                        {t('terms.close')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
