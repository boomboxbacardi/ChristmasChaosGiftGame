import { WARMUP_ROLLS } from '../constants/tables'
import { useChaosGame } from '../hooks/useChaosGame'
import { useTheme } from '../hooks/useTheme'
import { GameTemplate, SetupTemplate } from '../components/templates'

export const GamePage = () => {
  const game = useChaosGame()
  const { t } = game
  const { isHoliday, toggleTheme } = useTheme()

  const heroEyebrow = isHoliday ? `🎁 ${t('ui.hero.eyebrow')}` : t('ui.hero.eyebrow')
  const heroTitle = isHoliday ? `${t('ui.hero.title')} 🎄` : t('ui.hero.title')
  const heroSubtitle = isHoliday ? `${t('ui.hero.subtitle')} 🎁` : t('ui.hero.subtitle')
  const resetLabel = isHoliday ? `🎁 ${t('ui.reset')}` : t('ui.reset')
  const languageLabel = isHoliday ? `🌐 ${game.lang === 'sv' ? t('ui.lang.sv') : t('ui.lang.en')}` : game.lang === 'sv' ? t('ui.lang.sv') : t('ui.lang.en')
  const themeLabel = isHoliday
    ? game.lang === 'sv'
      ? '🌙 Mörkt läge'
      : '🌙 Dark mode'
    : game.lang === 'sv'
      ? '🎄 Jultema'
      : '🎄 Holiday'

  const setupActions = (
    <div className="hero-actions">
      <button
        className={`secondary ${isHoliday ? 'active' : ''}`}
        onClick={toggleTheme}
        aria-label={game.lang === 'sv' ? 'Växla jultema' : 'Toggle holiday theme'}
      >
        {themeLabel}
      </button>
      <button
        className="secondary"
        onClick={() => game.setLang((prev) => (prev === 'en' ? 'sv' : 'en'))}
        aria-label="Toggle language"
      >
        {languageLabel}
      </button>
    </div>
  )

  const orderModalData =
    game.showOrderModal
      ? {
          isOpen: true,
          order: game.pendingOrder,
          heading: t('ui.order.heading'),
          subtitle: t('ui.order.subtitle'),
          startLabel: t('ui.order.start'),
          startingLabel: t('ui.order.starting'),
          isStarting: game.isStartingGame,
          onStart: game.beginGameFromPending,
          onClose: () => game.setShowOrderModal(false),
        }
      : game.phaseBanner
        ? {
            isOpen: true,
            heading: game.phaseBanner,
            subtitle: t('ui.banner.body'),
            startLabel: t('ui.banner.cta'),
            startingLabel: t('ui.banner.cta'),
            isStarting: false,
            onStart: () => game.setPhaseBanner(null),
            onClose: () => game.setPhaseBanner(null),
          }
        : undefined

  if (game.phase === 'setup') {
    return (
      <SetupTemplate
        eyebrow={heroEyebrow}
        title={heroTitle}
        subtitle={heroSubtitle}
        actions={setupActions}
        setupTitle={t('ui.setup.title')}
        setupHint={t('ui.setup.hint')}
        players={game.setupPlayers}
        highlightedIndex={game.setupHighlightedIndex}
        onNameChange={game.updateSetupName}
        onRemove={game.removeSetupPlayer}
        onAdd={game.addSetupPlayer}
        playerPlaceholder={(idx) => t('ui.setup.playerPlaceholder', { num: idx })}
        removeLabel={t('ui.setup.remove')}
        addLabel={t('ui.setup.addPlayer')}
        totalLabel={t('ui.setup.total')}
        pileValue={game.setupPile}
        onPileChange={game.setSetupPile}
        onRandomize={game.startGameWithSetup}
        randomizeLabel={isHoliday ? `${t('ui.setup.randomize')} 🎲🎁` : t('ui.setup.randomize')}
        randomizingLabel={isHoliday ? `${t('ui.setup.randomizing')} 🎲` : t('ui.setup.randomizing')}
        isRandomizing={game.isSetupRandomizing}
        orderHeading={t('ui.order.heading')}
        orderSubtitle={t('ui.order.subtitle')}
        orderFallback={(num) => t('ui.order.playerFallback', { num })}
        order={game.pendingOrder}
        isOrderOpen={game.showOrderModal}
        onOrderClose={() => game.setShowOrderModal(false)}
        onOrderStart={game.beginGameFromPending}
        isStarting={game.isStartingGame}
        orderStartLabel={t('ui.order.start')}
        orderStartingLabel={t('ui.order.starting')}
      />
    )
  }

  const heroActions = (
    <>
      <button className="secondary" onClick={game.resetGame}>
        {resetLabel}
      </button>
      <button className={`secondary ${game.debugMode ? 'active' : ''}`} onClick={() => game.setDebugMode((v) => !v)}>
        {game.debugMode ? t('ui.debug.on') : t('ui.debug.off')}
      </button>
      {game.debugMode && (
        <button className="secondary" onClick={game.debugCyclePhase}>
          {t('ui.debug.togglePhase')}
        </button>
      )}
      <button
        className={`secondary ${isHoliday ? 'active' : ''}`}
        onClick={toggleTheme}
        aria-label={game.lang === 'sv' ? 'Växla jultema' : 'Toggle holiday theme'}
      >
        {themeLabel}
      </button>
      <button
        className="secondary"
        onClick={() => game.setLang((prev) => (prev === 'en' ? 'sv' : 'en'))}
        aria-label="Toggle language"
      >
        {languageLabel}
      </button>
    </>
  )

  return (
    <GameTemplate
      hero={{
        eyebrow: heroEyebrow,
        title: heroTitle,
        subtitle: heroSubtitle,
        actions: heroActions,
      }}
      status={{
        phaseLabel: game.currentPhaseLabel,
        pileLabel: t('ui.status.pile'),
        currentPlayerLabel: t('ui.status.current'),
        playerRollsLabel: t('ui.status.rollsPlayer'),
        totalRollsLabel: t('ui.status.rollsTotal'),
        pileCount: game.pileCount,
        currentPlayerName: game.currentPlayer.name,
        playerRolls: game.rollsRemaining[game.currentPlayer.id] ?? WARMUP_ROLLS,
        totalRolls: game.totalRollsLeft,
      }}
      players={game.players}
      currentPlayerIndex={game.currentPlayerIndex}
      phase={game.phase}
      playerTitle={isHoliday ? `${t('ui.players.title')} 🎁` : t('ui.players.title')}
      playerLegend={t('ui.players.legend')}
      playerEmptyLabel={t('ui.players.empty')}
      log={game.log}
      logTitle={isHoliday ? `${t('ui.log.title')} 📜` : t('ui.log.title')}
      logSubtitle={t('ui.log.subtitle')}
      logEmptyLabel={t('ui.log.empty')}
      randomizer={{
        phase: game.phase,
        phaseTable: game.phaseTable,
        headingWarmup: isHoliday ? `🎄 ${t('ui.randomizer.headingWarmup')}` : t('ui.randomizer.headingWarmup'),
        headingEndgame: isHoliday ? `❄️ ${t('ui.randomizer.headingEndgame')}` : t('ui.randomizer.headingEndgame'),
        hint: isHoliday ? `${t('ui.randomizer.hint')} ✨` : t('ui.randomizer.hint'),
        hintDebug: t('ui.randomizer.hintDebug'),
        highlightedIndex: game.highlightedIndex,
        isFinalResult: game.isFinalResult,
        canRoll: game.canRoll,
        isSpinning: game.isSpinning,
        onRoll: game.handleRoll,
        rollLabel: isHoliday ? `🎲 ${t('ui.roll.btn')}` : t('ui.roll.btn'),
        rollLabelSpinning: isHoliday ? `${t('ui.roll.randomizing')} 🎁` : t('ui.roll.randomizing'),
        rollLabelFinished: isHoliday ? `${t('ui.roll.finished')} ✨` : t('ui.roll.finished'),
        players: game.players,
        currentPlayerIndex: game.currentPlayerIndex,
        pileCount: game.pileCount,
        debugMode: game.debugMode,
      }}
      lastRoll={{ data: game.lastOutcome, label: t('ui.lastRoll'), emptyLabel: t('ui.lastRoll.empty') }}
      rules={{
        warmupTable: game.localizedWarmupTable,
        endgameTable: game.localizedEndgameTable,
        warmupTitle: isHoliday ? `🎁 ${t('ui.rules.warmup')}` : t('ui.rules.warmup'),
        endgameTitle: isHoliday ? `🎅 ${t('ui.rules.endgame')}` : t('ui.rules.endgame'),
        lockedNote: t('ui.rules.lockedNote'),
      }}
      giveAwayModal={{
        isOpen: game.showGiveAwayModal,
        actorName: game.giveAwayActorName ?? game.currentPlayer.name,
        target: game.giveAwayTarget,
        isRandomizing: game.isRandomizingTarget,
        title: t('actions.warmup.3.title'),
        verb: t('ui.modal.giveVerb'),
        closeLabel: t('ui.modal.close'),
        onClose: game.handleCloseGiveAwayModal,
      }}
      stealModal={{
        isOpen: game.showStealModal,
        actorName: game.stealActorName ?? game.currentPlayer.name,
        target: game.stealTarget,
        isRandomizing: game.isRandomizingTarget,
        title: t('actions.warmup.4.title'),
        verb: t('ui.modal.stealVerb'),
        closeLabel: t('ui.modal.close'),
        onClose: game.handleCloseStealModal,
      }}
      narrativeModal={{
        isOpen: game.showNarrativeModal,
        title: game.narrativeTitle,
        narrative: game.narrativeBody,
        closeLabel: t('ui.modal.close'),
        onClose: game.handleCloseNarrativeModal,
      }}
      selectionModal={{
        isOpen: game.showSelectionModal,
        title: game.selectionTitle,
        verb: game.selectionVerb,
        actorName: game.selectionActorName ?? game.currentPlayer.name,
        targetName: game.selectionTarget,
        leadEmoji: game.selectionLeadEmoji,
        trailEmoji: game.selectionTrailEmoji,
        isRandomizing: game.isRandomizingSelection,
        onClose: game.handleCloseSelectionModal,
      }}
      orderModal={orderModalData}
    />
  )
}
