import { PrimaryButton } from '../ui'
import { DancingSkeleton } from './DancingSkeleton'

interface InspirationScreenProps {
  onBack: () => void
}

export function InspirationScreen({ onBack }: InspirationScreenProps) {
  return (
    <div className="inspiration-screen" role="dialog" aria-live="polite">
      <div className="inspiration-screen-inner">
        <blockquote className="snes-blockquote has-galaxy-bg inspiration-main-quote">
          <p className="inspiration-body">
            se vc tiver salvo todos os dados da sua ficha possíveis e não tenha ficado de preguiça, de fato
            vai valer um ponto de inspiração. mas eu vou ver se tá tudo salvo mesmo. dá pra salvar várias
            vezes, fica suave.
          </p>
          <div className="inspiration-session text-sunshine-color">
            <p>próxima sessão:</p>
            <p>data: a decidir (26/07?)</p>
            <p>numero: 22</p>
            <p>onde terminaram: bebendo no cais</p>
          </div>
        </blockquote>

        <div className="inspiration-memorial-stage">
          <div className="inspiration-skeleton-row">
            <DancingSkeleton className="inspiration-skeleton" delay={0} />
            <DancingSkeleton className="inspiration-skeleton" flip delay={0.15} />
            <DancingSkeleton className="inspiration-skeleton" delay={0.3} />
            <DancingSkeleton className="inspiration-skeleton" flip delay={0.45} />
          </div>

          <blockquote className="snes-blockquote has-plumber-bg inspiration-memorial">
            <p className="text-plumber-color inspiration-rip">
              <span className="inspiration-cross">+</span>
              rip touro gay
              <span className="inspiration-cross">+</span>
            </p>
            <p className="text-galaxy-color mt-4">2025 - 2026</p>
            <p className="text-nature-color mt-4">
              margem norte do lago
              <br />
              (morreu pra bixo CR5 LOL)
            </p>
          </blockquote>
        </div>

        <div className="inspiration-recap-stage">
          <span className="inspiration-recap-spark inspiration-recap-spark-left">+</span>
          <span className="inspiration-recap-spark inspiration-recap-spark-right">+</span>
          <blockquote className="snes-blockquote has-nature-bg inspiration-recap">
            <p className="text-nature-color inspiration-recap-title">até agora:</p>
            <ul className="inspiration-recap-list text-galaxy-color">
              <li>visitaram 2 vilas</li>
              <li>visitaram 1 plano diferente do material</li>
              <li>fumaram 14kg de erva de halfling</li>
              <li>bebaram em mais de 5 localizações diferentes</li>
              <li>não encontraram as tão famosas elfas</li>
              <li>tiveram uma morte na pt</li>
            </ul>
          </blockquote>
        </div>

        <PrimaryButton type="button" onClick={onBack} color="galaxy" className="inspiration-back-btn">
          Voltar à ficha
        </PrimaryButton>
      </div>
    </div>
  )
}
